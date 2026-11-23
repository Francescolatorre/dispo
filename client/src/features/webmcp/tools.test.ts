import { LocalRepository } from '../../data/localRepository';
import { createPlanningActions, snapshotFromRepository, type PlanningActions } from '../../domain/planningActions';
import { workloadStatus } from '../../domain/workload';
import type { ModelContextTool, ToolResult } from './modelContext';
import { PLANNING_TOOL_NAMES, createPlanningTools, type ToolWriteEvent } from './tools';

// Wednesday of ISO week 2026-W48; seed week 0 starts Monday 2026-11-23.
const TODAY = '2026-11-25';

interface Setup {
  repo: LocalRepository;
  actions: PlanningActions;
  tools: Record<string, ModelContextTool>;
  events: ToolWriteEvent[];
  call: (name: string, input?: unknown) => Promise<ToolResult>;
}

function setup(): Setup {
  const repo = new LocalRepository({ storage: null, today: TODAY });
  const actions = createPlanningActions(repo, () => snapshotFromRepository(repo));
  const events: ToolWriteEvent[] = [];
  const list = createPlanningTools(
    async () => ({ ...(await snapshotFromRepository(repo)), actions, today: TODAY }),
    { onWrite: (e) => events.push(e) },
  );
  const tools = Object.fromEntries(list.map((t) => [t.name, t]));
  const call = (name: string, input: unknown = {}) => tools[name].execute(input as Record<string, unknown>);
  return { repo, actions, tools, events, call };
}

type Row = Record<string, unknown>;
const rows = (r: ToolResult, key: string) => r[key] as Row[];

describe('createPlanningTools — definitions', () => {
  it('defines the nine tools with object schemas and hints', () => {
    const { tools } = setup();
    expect(Object.keys(tools)).toEqual(PLANNING_TOOL_NAMES);
    expect(PLANNING_TOOL_NAMES).toEqual([
      'get_guide',
      'list_employees',
      'list_projects',
      'get_workload',
      'find_free_capacity',
      'create_assignment',
      'update_assignment',
      'delete_assignment',
      'undo_last_change',
    ]);
    for (const t of Object.values(tools)) {
      expect(t.description.length).toBeGreaterThan(40);
      expect(t.inputSchema.type).toBe('object');
      expect(t.inputSchema.additionalProperties).toBe(false);
      // Must survive structured cloning / JSON transport.
      expect(JSON.parse(JSON.stringify(t.inputSchema))).toEqual(t.inputSchema);
    }
    for (const name of ['get_guide', 'list_employees', 'list_projects', 'get_workload', 'find_free_capacity']) {
      expect(tools[name].annotations?.readOnlyHint).toBe(true);
    }
    expect(tools.create_assignment.annotations?.readOnlyHint).toBe(false);
    expect(tools.delete_assignment.annotations?.consequentialHint).toBe(true);
    expect(tools.undo_last_change.annotations?.consequentialHint).toBe(true);
  });

  it('rejects unknown parameters and non-object input with an actionable message', async () => {
    const { call } = setup();
    const r = await call('list_employees', { team: 'x' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Unbekannte Parameter: team/);
    expect((await call('list_employees', [1])).ok).toBe(false);
  });

  it('accepts JSON-stringified arguments (older Chrome builds)', async () => {
    const { call } = setup();
    const r = await call('list_employees', JSON.stringify({ role: 'QA' }));
    expect(r.ok).toBe(true);
    expect(r.count).toBe(2);
  });
});

describe('get_guide', () => {
  it('returns all sections with live context and thresholds from the engine', async () => {
    const { call } = setup();
    const r = await call('get_guide');
    expect(r.ok).toBe(true);
    const guide = r.guide as Record<string, Record<string, unknown>>;
    expect(Object.keys(guide)).toEqual(['context', 'overview', 'concepts', 'workflow', 'sops', 'pitfalls', 'tools']);
    expect(guide.context).toEqual({ today: TODAY, currentWeek: '2026-W48' });
    expect(JSON.stringify(guide.concepts)).toContain('bis 50 % utilization');
    expect(Object.keys(guide.sops).length).toBeGreaterThanOrEqual(8);
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });

  it('returns a single topic and rejects unknown topics', async () => {
    const { call } = setup();
    const r = await call('get_guide', { topic: 'sops' });
    expect(Object.keys(r.guide as object)).toEqual(['context', 'sops']);
    const bad = await call('get_guide', { topic: 'secrets' });
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/Unbekanntes topic/);
  });
});

describe('read tools', () => {
  it('list_employees filters by role, activity and name', async () => {
    const { call } = setup();
    expect((await call('list_employees')).count).toBe(13);
    expect((await call('list_employees', { activeOnly: false })).count).toBe(14);
    const backend = await call('list_employees', { role: 'backend' });
    expect(rows(backend, 'employees').map((e) => e.name)).toEqual(['Jonas Fischer', 'Lukas Müller', 'Paul Richter']);
    const anna = await call('list_employees', { query: 'schmidt' });
    expect(rows(anna, 'employees')).toEqual([
      { id: 'emp-01', name: 'Anna Schmidt', role: 'Frontend', seniority: 'senior', capacity: 1, active: true },
    ]);
  });

  it('list_projects filters by status and rejects unknown statuses', async () => {
    const { call } = setup();
    const planned = await call('list_projects', { status: 'planned' });
    expect(rows(planned, 'projects').map((p) => p.name)).toEqual(['CRM-Migration', 'KI-Assistent']);
    expect(rows(planned, 'projects')[0]).toMatchObject({ id: 'prj-05', assignmentCount: 4 });
    const bad = await call('list_projects', { status: 'running' });
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/planned, active, done/);
  });

  it('get_workload returns per-person, per-week load with the domain status', async () => {
    const { call } = setup();
    const r = await call('get_workload', { from: '2026-W48', to: '2026-W49', employeeIds: ['emp-04'] });
    expect(r).toMatchObject({ ok: true, from: '2026-11-23', to: '2026-12-04', weeks: ['2026-W48', '2026-W49'] });
    const [jonas] = rows(r, 'employees');
    expect(jonas.name).toBe('Jonas Fischer');
    const weeks = jonas.weeks as Row[];
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toMatchObject({ week: '2026-W48', load: 120, utilization: 120, freePercent: 0, status: workloadStatus(120) });
    expect(weeks[0].assignmentIds).toEqual(['asg-06', 'asg-07', 'asg-08']);
    expect((jonas.assignments as Row[]).map((a) => a.id)).toEqual(['asg-06', 'asg-07', 'asg-08']);
    expect((jonas.assignments as Row[])[0]).toMatchObject({ projectName: 'Security-Audit', allocation: 50 });
  });

  it('get_workload defaults to 8 weeks of all active people', async () => {
    const { call } = setup();
    const r = await call('get_workload');
    expect(r.weeks as string[]).toHaveLength(8);
    expect(r.from).toBe('2026-11-23');
    expect(rows(r, 'employees')).toHaveLength(13);
  });

  it('get_workload reports invalid dates, reversed or oversized ranges and unknown ids', async () => {
    const { call } = setup();
    const invalid = await call('get_workload', { from: '2026-13-01', to: '2026-12-31' });
    expect(invalid.ok).toBe(false);
    expect(invalid.error).toMatch(/kein gültiges Datum/);
    const badWeek = await call('get_workload', { from: '2026-W60' });
    expect(badWeek.error).toMatch(/keine gültige ISO-Woche/);
    const reversed = await call('get_workload', { from: '2026-12-10', to: '2026-12-01' });
    expect(reversed.error).toMatch(/liegt vor/);
    const huge = await call('get_workload', { from: '2026-01-01', to: '2027-12-31' });
    expect(huge.error).toMatch(/maximal 26/);
    const unknown = await call('get_workload', { employeeIds: ['emp-99'] });
    expect(unknown.error).toMatch(/emp-99.*list_employees/);
  });

  it('find_free_capacity finds people free next month, filtered by role', async () => {
    const { call } = setup();
    const r = await call('find_free_capacity', { from: '2026-W52', to: '2026-W53', minFreePercent: 100 });
    const names = rows(r, 'candidates').map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['Felix Becker', 'Paul Richter']));
    expect(rows(r, 'candidates')[0]).toMatchObject({ minFreePercent: 100 });
    const frontend = await call('find_free_capacity', { from: '2026-W52', to: '2026-W53', minFreePercent: 100, role: 'Frontend' });
    expect(rows(frontend, 'candidates').map((c) => c.name)).toEqual(['Felix Becker']);
    const none = await call('find_free_capacity', { from: '2026-W48', to: '2026-W49', minFreePercent: 100, role: 'Backend' });
    expect(none.count).toBe(0);
    expect(none.hint).toBeDefined();
    expect((await call('find_free_capacity', { minFreePercent: 150 })).ok).toBe(false);
  });
});

describe('create_assignment', () => {
  const input = { employeeName: 'felix', projectName: 'KI-Assistent', start: '2026-W52', end: '2026-W53', allocation: 50 };

  it('resolves names, writes through the actions and reports impact', async () => {
    const { call, repo, actions, events } = setup();
    const r = await call('create_assignment', input);
    expect(r).toMatchObject({ ok: true, dryRun: false, warnings: [], undoLabel: 'Einsatz anlegen' });
    expect(r.summary).toBe('Felix Becker wird 2026-12-21 bis 2027-01-01 mit 50 % auf KI-Assistent eingeplant.');
    expect(r.assignment).toMatchObject({ employeeId: 'emp-06', projectId: 'prj-06', start: '2026-12-21', end: '2027-01-01' });
    expect(rows(r, 'impact')).toEqual([
      expect.objectContaining({ employeeName: 'Felix Becker', week: '2026-W52', utilizationBefore: 0, utilizationAfter: 50, statusBefore: workloadStatus(0), statusAfter: workloadStatus(50) }),
      expect.objectContaining({ week: '2026-W53', utilizationAfter: 50 }),
    ]);
    expect(await repo.listAssignments()).toHaveLength(31);
    expect(actions.undoLabel()).toBe('Einsatz anlegen');
    expect(events).toEqual([expect.objectContaining({ tool: 'create_assignment', kind: 'write', label: 'Einsatz anlegen' })]);
  });

  it('dryRun validates and previews without writing', async () => {
    const { call, repo, actions, events } = setup();
    const r = await call('create_assignment', { ...input, dryRun: true });
    expect(r.ok).toBe(true);
    expect(r.dryRun).toBe(true);
    expect(String(r.summary)).toMatch(/^Vorschau \(nicht gespeichert\)/);
    expect(r.assignment).not.toHaveProperty('id');
    expect(rows(r, 'impact')).toHaveLength(2);
    expect(await repo.listAssignments()).toHaveLength(30);
    expect(actions.canUndo()).toBe(false);
    expect(events).toHaveLength(0);
  });

  it('warns about overbooking but still writes', async () => {
    const { call } = setup();
    const r = await call('create_assignment', { employeeId: 'emp-04', projectId: 'prj-01', start: '2026-W48', end: '2026-W48', allocation: 20 });
    expect(r.ok).toBe(true);
    expect(String(r.summary)).toMatch(/über 100 %/);
    expect((r.warnings as string[]).join(' ')).toMatch(/über 100 %/);
  });

  it('returns candidates for ambiguous names and hints for unknown ones', async () => {
    const { call, repo } = setup();
    const ambiguous = await call('create_assignment', { ...input, employeeName: 'Sch' });
    expect(ambiguous.ok).toBe(false);
    expect(ambiguous.error).toMatch(/mehrdeutig/);
    expect(rows(ambiguous, 'candidates').map((c) => c.name)).toEqual(['Anna Schmidt', 'Jonas Fischer', 'Maximilian Schulz', 'Julia Schröder']);
    const unknown = await call('create_assignment', { ...input, employeeName: 'Zorro' });
    expect(unknown.error).toMatch(/list_employees/);
    const unknownProject = await call('create_assignment', { ...input, projectName: 'Mars' });
    expect(unknownProject.error).toMatch(/list_projects/);
    const unknownId = await call('create_assignment', { ...input, employeeName: undefined, employeeId: 'emp-99' });
    expect(unknownId.error).toMatch(/emp-99/);
    const missing = await call('create_assignment', { ...input, employeeName: undefined });
    expect(missing.error).toMatch(/employeeId.*employeeName/);
    expect(await repo.listAssignments()).toHaveLength(30);
  });

  it('prefers an exact name match over substring matches', async () => {
    const { call } = setup();
    // "Mobile App 2.0" is the only project containing "mobile"; exact match also works case-insensitively.
    const r = await call('create_assignment', { ...input, projectName: 'mobile app 2.0', dryRun: true });
    expect(r.assignment).toMatchObject({ projectName: 'Mobile App 2.0' });
  });

  it('returns blocking validation errors without writing', async () => {
    const { call, repo } = setup();
    const step = await call('create_assignment', { ...input, allocation: 55 });
    expect(step.ok).toBe(false);
    expect(rows(step, 'errors')[0]).toMatchObject({ code: 'ALLOCATION_STEP' });
    expect(step.error).toMatch(/10er-Schritten/);
    const reversed = await call('create_assignment', { ...input, start: '2027-01-10', end: '2027-01-01' });
    expect(rows(reversed, 'errors')[0]).toMatchObject({ code: 'END_BEFORE_START' });
    const badDate = await call('create_assignment', { ...input, start: '21.12.2026' });
    expect(badDate.error).toMatch(/kein gültiges Datum/);
    const missing = await call('create_assignment', { employeeId: 'emp-06', projectId: 'prj-06', start: '2026-W52', end: '2026-W53' });
    expect(missing.error).toMatch(/"allocation" fehlt/);
    expect(await repo.listAssignments()).toHaveLength(30);
  });
});

describe('update_assignment', () => {
  it('shifts by weeks via the move action', async () => {
    const { call, repo, events } = setup();
    const r = await call('update_assignment', { id: 'asg-01', shiftWeeks: 1 });
    expect(r).toMatchObject({ ok: true, undoLabel: 'Einsatz verschieben' });
    expect(String(r.summary)).toMatch(/^Einsatz Website-Relaunch verschoben: Anna Schmidt/);
    const moved = (await repo.listAssignments()).find((a) => a.id === 'asg-01');
    expect(moved).toMatchObject({ start: '2026-11-02', end: '2027-01-15' });
    expect(events[0]).toMatchObject({ label: 'Einsatz verschieben' });
  });

  it('changes allocation, role and person; hands over by name', async () => {
    const { call, repo } = setup();
    const r = await call('update_assignment', { id: 'asg-08', allocation: 10, role: 'Release', employeeName: 'Paul' });
    expect(r).toMatchObject({ ok: true, undoLabel: 'Einsatz ändern' });
    expect(await repo.listAssignments()).toContainEqual(expect.objectContaining({ id: 'asg-08', allocation: 10, role: 'Release', employeeId: 'emp-10' }));
    // Both Jonas (loses 30 %) and Paul (gains 10 %) show up in the impact.
    const names = new Set(rows(r, 'impact').map((i) => i.employeeName));
    expect(names).toEqual(new Set(['Jonas Fischer', 'Paul Richter']));
  });

  it('dryRun does not write', async () => {
    const { call, repo, actions } = setup();
    const r = await call('update_assignment', { id: 'asg-01', start: '2026-W50', dryRun: true });
    expect(r).toMatchObject({ ok: true, dryRun: true });
    expect((await repo.listAssignments()).find((a) => a.id === 'asg-01')?.start).toBe('2026-10-26');
    expect(actions.canUndo()).toBe(false);
  });

  it('reports unknown ids, empty or conflicting changes and blocking errors', async () => {
    const { call } = setup();
    expect((await call('update_assignment', { id: 'asg-99', allocation: 50 })).error).toMatch(/get_workload/);
    expect((await call('update_assignment', { id: 'asg-01' })).error).toMatch(/Keine Änderung/);
    expect((await call('update_assignment', { id: 'asg-01', shiftWeeks: 1, start: '2026-W50' })).error).toMatch(/shiftWeeks/);
    const tooMuch = await call('update_assignment', { id: 'asg-01', allocation: 120 });
    expect(rows(tooMuch, 'errors')[0]).toMatchObject({ code: 'ALLOCATION_RANGE' });
    expect((await call('update_assignment', { allocation: 50 })).error).toMatch(/"id" fehlt/);
  });
});

describe('delete_assignment + undo_last_change', () => {
  it('deletes, then undo restores the assignment with its original id', async () => {
    const { call, repo, events } = setup();
    const before = (await repo.listAssignments()).find((a) => a.id === 'asg-08');
    const r = await call('delete_assignment', { id: 'asg-08' });
    expect(r).toMatchObject({ ok: true, undoLabel: 'Einsatz löschen', undoHint: expect.stringMatching(/undo_last_change/) });
    expect(String(r.summary)).toMatch(/Jonas Fischer auf Mobile App 2.0.*gelöscht/);
    expect(rows(r, 'impact')[0]).toMatchObject({ employeeName: 'Jonas Fischer', utilizationBefore: 120, utilizationAfter: 90 });
    expect((await repo.listAssignments()).some((a) => a.id === 'asg-08')).toBe(false);

    const u = await call('undo_last_change', { expectedLabel: 'Einsatz löschen' });
    expect(u).toMatchObject({ ok: true, undone: 'Einsatz löschen', summary: 'Rückgängig gemacht: Einsatz löschen.' });
    expect((await repo.listAssignments()).find((a) => a.id === 'asg-08')).toEqual(before);
    expect(events.map((e) => e.kind)).toEqual(['write', 'undo']);
  });

  it('dryRun delete keeps the assignment', async () => {
    const { call, repo } = setup();
    const r = await call('delete_assignment', { id: 'asg-08', dryRun: true });
    expect(String(r.summary)).toMatch(/würde gelöscht/);
    expect((await repo.listAssignments()).some((a) => a.id === 'asg-08')).toBe(true);
  });

  it('undo refuses a stale expectedLabel and an empty history; delete reports unknown ids', async () => {
    const { call, repo } = setup();
    expect((await call('undo_last_change')).error).toMatch(/nichts rückgängig/);
    await call('update_assignment', { id: 'asg-01', shiftWeeks: 1 });
    const stale = await call('undo_last_change', { expectedLabel: 'Einsatz löschen' });
    expect(stale).toMatchObject({ ok: false, lastChange: 'Einsatz verschieben' });
    // Not undone: the shift is still in place.
    expect((await repo.listAssignments()).find((a) => a.id === 'asg-01')?.start).toBe('2026-11-02');
    expect((await call('delete_assignment', { id: 'nope' })).error).toMatch(/nicht gefunden/);
  });
});
