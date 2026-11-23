/**
 * The ONLY write path for the UI and (later) WebMCP tools.
 *
 * Every write: validate → blocking errors ⇒ `{ ok: false, errors }` → otherwise apply
 * (unless `dryRun`) and return `{ ok: true, result, warnings, impact }`, where `impact`
 * lists every employee-week whose utilization changes (before/after).
 *
 * Every applied write pushes an operation onto an undo stack. Undoing a delete re-creates
 * the entity (and any cascaded assignments) with its ORIGINAL id — repositories accept
 * client-supplied ids — so older history entries keep referring to the right records.
 */
import type { Repository } from '../data/repository';
import { addWeeks, listWeeks, maxISODate, minISODate } from './dates';
import type {
  Assignment,
  AssignmentInput,
  AssignmentUpdate,
  Employee,
  EmployeeInput,
  EmployeeUpdate,
  ISODate,
  PlanningData,
  Project,
  ProjectInput,
  ProjectUpdate,
  WeekKey,
} from './types';
import {
  overbookedWeeks,
  validateAssignment,
  validateEmployee,
  validateProject,
  type ValidationIssue,
} from './validation';
import { computeWeekLoad, type WorkloadStatus } from './workload';

export interface ActionOptions {
  /** Validate and compute impact without writing (no history entry either). */
  dryRun?: boolean;
}

export interface ImpactEntry {
  employeeId: string;
  weekKey: WeekKey;
  weekStart: ISODate;
  before: number;
  after: number;
  beforeStatus: WorkloadStatus;
  afterStatus: WorkloadStatus;
}

export interface ActionSuccess<T> {
  ok: true;
  dryRun: boolean;
  /** The written entity (for deletes: the removed entity; for dry-run creates: id `dry-run`). */
  result: T;
  warnings: ValidationIssue[];
  impact: ImpactEntry[];
}

export interface ActionFailure {
  ok: false;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export interface HistoryResult {
  ok: boolean;
  /** Human-readable label of the undone/redone action. */
  label?: string;
  error?: string;
}

export interface MoveAssignmentInput {
  /** Shift start and end by this many weeks (may be negative). */
  weeks?: number;
  /** Reassign to another person. */
  employeeId?: string;
}

export interface PlanningActions {
  createAssignment(input: AssignmentInput, options?: ActionOptions): Promise<ActionResult<Assignment>>;
  updateAssignment(id: string, patch: AssignmentUpdate, options?: ActionOptions): Promise<ActionResult<Assignment>>;
  moveAssignment(id: string, move: MoveAssignmentInput, options?: ActionOptions): Promise<ActionResult<Assignment>>;
  deleteAssignment(id: string, options?: ActionOptions): Promise<ActionResult<Assignment>>;

  createEmployee(input: EmployeeInput, options?: ActionOptions): Promise<ActionResult<Employee>>;
  updateEmployee(id: string, patch: EmployeeUpdate, options?: ActionOptions): Promise<ActionResult<Employee>>;
  /** Cascades to the employee's assignments (restored together on undo). */
  deleteEmployee(id: string, options?: ActionOptions): Promise<ActionResult<Employee>>;

  createProject(input: ProjectInput, options?: ActionOptions): Promise<ActionResult<Project>>;
  updateProject(id: string, patch: ProjectUpdate, options?: ActionOptions): Promise<ActionResult<Project>>;
  /** Cascades to the project's assignments (restored together on undo). */
  deleteProject(id: string, options?: ActionOptions): Promise<ActionResult<Project>>;

  undo(): Promise<HistoryResult>;
  redo(): Promise<HistoryResult>;
  canUndo(): boolean;
  canRedo(): boolean;
  /** Label of the action `undo()` would revert, if any. */
  undoLabel(): string | undefined;
  redoLabel(): string | undefined;
  clearHistory(): void;
}

const PAST_TENSE: Record<string, string> = {
  anlegen: 'angelegt',
  ändern: 'geändert',
  verschieben: 'verschoben',
  löschen: 'gelöscht',
};

/**
 * Display text of a history label in tooltips and toasts: `Einsatz verschieben` →
 * `Einsatz verschoben` ("Rückgängig: Einsatz verschoben"). The labels themselves stay the
 * stable identifiers that `undoLabel()` returns (they are compared by undo toasts and tools).
 */
export function historyLabelText(label: string): string {
  const i = label.lastIndexOf(' ');
  const verb = label.slice(i + 1);
  return PAST_TENSE[verb] ? `${label.slice(0, i + 1)}${PAST_TENSE[verb]}` : label;
}

export interface PlanningActionsOptions {
  /** Awaited after every applied write, undo and redo (e.g. to re-read state). */
  onChange?: () => void | Promise<void>;
  /** Max undo entries kept (default 100). */
  historyLimit?: number;
}

export type StateGetter = () => PlanningData | Promise<PlanningData>;

/** Reads a full snapshot from a repository — handy as `getState` outside React. */
export async function snapshotFromRepository(repo: Repository): Promise<PlanningData> {
  const [employees, projects, assignments] = await Promise.all([
    repo.listEmployees(),
    repo.listProjects(),
    repo.listAssignments(),
  ]);
  return { employees, projects, assignments };
}

// ---- impact ----------------------------------------------------------------------------

/** Utilization changes for `employeeIds` within [from, to] between two snapshots. */
export function computeImpact(
  before: Pick<PlanningData, 'employees' | 'assignments'>,
  after: Pick<PlanningData, 'employees' | 'assignments'>,
  employeeIds: readonly string[],
  from: ISODate,
  to: ISODate,
): ImpactEntry[] {
  const weeks = listWeeks(from, to);
  const entries: ImpactEntry[] = [];
  for (const employeeId of new Set(employeeIds)) {
    const eBefore = before.employees.find((e) => e.id === employeeId);
    const eAfter = after.employees.find((e) => e.id === employeeId);
    for (const w of weeks) {
      const b = eBefore ? computeWeekLoad(eBefore, before.assignments, w) : undefined;
      const a = eAfter ? computeWeekLoad(eAfter, after.assignments, w) : undefined;
      const beforeUtil = b?.utilization ?? 0;
      const afterUtil = a?.utilization ?? 0;
      if (beforeUtil === afterUtil) continue;
      entries.push({
        employeeId,
        weekKey: w.key,
        weekStart: w.start,
        before: beforeUtil,
        after: afterUtil,
        beforeStatus: b?.status ?? 'free',
        afterStatus: a?.status ?? 'free',
      });
    }
  }
  return entries;
}

function span(items: ReadonlyArray<{ start: ISODate; end: ISODate }>): { from: ISODate; to: ISODate } | null {
  if (items.length === 0) return null;
  return items.reduce(
    (acc, i) => ({ from: minISODate(acc.from, i.start), to: maxISODate(acc.to, i.end) }),
    { from: items[0].start, to: items[0].end },
  );
}

// ---- history ops -----------------------------------------------------------------------

type EntityName = 'employee' | 'project' | 'assignment';
type Data = Record<string, unknown>;

type Op =
  | { type: 'create'; entity: EntityName; id: string; data: Data; cascade?: Assignment[] }
  | { type: 'delete'; entity: EntityName; id: string; data: Data; cascade?: Assignment[] }
  | { type: 'update'; entity: EntityName; id: string; patch: Data; inverse: Data };

interface HistoryEntry {
  label: string;
  op: Op;
}

function invert(op: Op): Op {
  switch (op.type) {
    case 'create':
      return { ...op, type: 'delete' };
    case 'delete':
      return { ...op, type: 'create' };
    case 'update':
      return { ...op, patch: op.inverse, inverse: op.patch };
  }
}

function withoutId<T extends { id: string }>(entity: T): Data {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...rest } = entity;
  return rest;
}

function inversePatch(entity: Data, patch: Data): Data {
  const inverse: Data = {};
  for (const key of Object.keys(patch)) {
    if (patch[key] === undefined) continue;
    // `role` is optional on assignments: restoring "no role" needs an explicit null.
    inverse[key] = entity[key] === undefined ? null : entity[key];
  }
  return inverse;
}

const notFound = (entity: EntityName, id: string): ActionFailure => ({
  ok: false,
  errors: [{ code: 'NOT_FOUND', message: `${entity} "${id}" nicht gefunden.` }],
  warnings: [],
});

// ---- factory ---------------------------------------------------------------------------

export function createPlanningActions(
  repo: Repository,
  getState: StateGetter,
  options: PlanningActionsOptions = {},
): PlanningActions {
  const historyLimit = options.historyLimit ?? 100;
  const past: HistoryEntry[] = [];
  const future: HistoryEntry[] = [];
  let queue: Promise<unknown> = Promise.resolve();

  /** Runs writes strictly one after another so state reads and history stay consistent. */
  function serialize<T>(fn: () => Promise<T>): Promise<T> {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
  }

  async function applyOp(op: Op): Promise<void> {
    const { id } = op;
    if (op.type === 'create') {
      const data = { ...op.data, id };
      if (op.entity === 'employee') await repo.createEmployee(data as unknown as EmployeeInput);
      else if (op.entity === 'project') await repo.createProject(data as unknown as ProjectInput);
      else await repo.createAssignment(data as unknown as AssignmentInput);
      for (const a of op.cascade ?? []) await repo.createAssignment(a);
      return;
    }
    if (op.type === 'delete') {
      if (op.entity === 'employee') await repo.deleteEmployee(id);
      else if (op.entity === 'project') await repo.deleteProject(id);
      else await repo.deleteAssignment(id);
      return;
    }
    const patch = op.patch;
    if (op.entity === 'employee') await repo.updateEmployee(id, patch as EmployeeUpdate);
    else if (op.entity === 'project') await repo.updateProject(id, patch as ProjectUpdate);
    else await repo.updateAssignment(id, patch as AssignmentUpdate);
  }

  async function commit(label: string, op: Op): Promise<void> {
    past.push({ label, op });
    if (past.length > historyLimit) past.shift();
    future.length = 0;
    await options.onChange?.();
  }

  // ---- assignments ---------------------------------------------------------------------

  function mergeAssignment(existing: Assignment, patch: AssignmentUpdate): Assignment {
    const { role, ...rest } = patch;
    const merged: Assignment = { ...existing };
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) (merged as unknown as Data)[k] = v;
    if (role === null) delete merged.role;
    else if (role !== undefined) merged.role = role;
    return merged;
  }

  async function updateAssignmentInternal(
    id: string,
    patch: AssignmentUpdate,
    opts: ActionOptions,
    label: string,
  ): Promise<ActionResult<Assignment>> {
    const state = await getState();
    const existing = state.assignments.find((a) => a.id === id);
    if (!existing) return notFound('assignment', id);
    const merged = mergeAssignment(existing, patch);
    const { errors, warnings } = validateAssignment(withoutId(merged) as unknown as AssignmentInput, state, id);
    if (errors.length > 0) return { ok: false, errors, warnings };

    const afterAssignments = state.assignments.map((a) => (a.id === id ? merged : a));
    const range = span([existing, merged]) as { from: ISODate; to: ISODate };
    const impact = computeImpact(
      state,
      { employees: state.employees, assignments: afterAssignments },
      [existing.employeeId, merged.employeeId],
      range.from,
      range.to,
    );
    if (opts.dryRun) return { ok: true, dryRun: true, result: merged, warnings, impact };

    const result = await repo.updateAssignment(id, patch);
    await commit(label, {
      type: 'update',
      entity: 'assignment',
      id,
      patch: { ...patch },
      inverse: inversePatch(existing as unknown as Data, patch as Data),
    });
    return { ok: true, dryRun: false, result, warnings, impact };
  }

  const actions: PlanningActions = {
    createAssignment: (input, opts = {}) =>
      serialize(async () => {
        const state = await getState();
        const { errors, warnings } = validateAssignment(input, state);
        if (errors.length > 0) return { ok: false, errors, warnings };
        const draft: Assignment = { ...input, id: 'dry-run' };
        const impact = computeImpact(
          state,
          { employees: state.employees, assignments: [...state.assignments, draft] },
          [input.employeeId],
          input.start,
          input.end,
        );
        if (opts.dryRun) return { ok: true, dryRun: true, result: draft, warnings, impact };
        const result = await repo.createAssignment(input);
        await commit('Einsatz anlegen', { type: 'create', entity: 'assignment', id: result.id, data: withoutId(result) });
        return { ok: true, dryRun: false, result, warnings, impact };
      }),

    updateAssignment: (id, patch, opts = {}) =>
      serialize(() => updateAssignmentInternal(id, patch, opts, 'Einsatz ändern')),

    moveAssignment: (id, move, opts = {}) =>
      serialize(async () => {
        const state = await getState();
        const existing = state.assignments.find((a) => a.id === id);
        if (!existing) return notFound('assignment', id);
        const weeks = move.weeks ?? 0;
        const patch: AssignmentUpdate = {};
        if (weeks !== 0) {
          patch.start = addWeeks(existing.start, weeks);
          patch.end = addWeeks(existing.end, weeks);
        }
        if (move.employeeId !== undefined && move.employeeId !== existing.employeeId) patch.employeeId = move.employeeId;
        return updateAssignmentInternal(id, patch, opts, 'Einsatz verschieben');
      }),

    deleteAssignment: (id, opts = {}) =>
      serialize(async () => {
        const state = await getState();
        const existing = state.assignments.find((a) => a.id === id);
        if (!existing) return notFound('assignment', id);
        const impact = computeImpact(
          state,
          { employees: state.employees, assignments: state.assignments.filter((a) => a.id !== id) },
          [existing.employeeId],
          existing.start,
          existing.end,
        );
        if (opts.dryRun) return { ok: true, dryRun: true, result: existing, warnings: [], impact };
        await repo.deleteAssignment(id);
        await commit('Einsatz löschen', { type: 'delete', entity: 'assignment', id, data: withoutId(existing) });
        return { ok: true, dryRun: false, result: existing, warnings: [], impact };
      }),

    // ---- employees -----------------------------------------------------------------------

    createEmployee: (input, opts = {}) =>
      serialize(async () => {
        const { errors, warnings } = validateEmployee(input);
        if (errors.length > 0) return { ok: false, errors, warnings };
        if (opts.dryRun) return { ok: true, dryRun: true, result: { ...input, id: 'dry-run' }, warnings, impact: [] };
        const result = await repo.createEmployee(input);
        await commit('Person anlegen', { type: 'create', entity: 'employee', id: result.id, data: withoutId(result) });
        return { ok: true, dryRun: false, result, warnings, impact: [] };
      }),

    updateEmployee: (id, patch, opts = {}) =>
      serialize(async () => {
        const state = await getState();
        const existing = state.employees.find((e) => e.id === id);
        if (!existing) return notFound('employee', id);
        const merged: Employee = { ...existing };
        for (const [k, v] of Object.entries(patch)) if (v !== undefined) (merged as unknown as Data)[k] = v;
        const { errors } = validateEmployee(withoutId(merged) as unknown as EmployeeInput);
        if (errors.length > 0) return { ok: false, errors, warnings: [] };

        const warnings: ValidationIssue[] = [];
        const own = state.assignments.filter((a) => a.employeeId === id);
        const range = span(own);
        const after = { employees: state.employees.map((e) => (e.id === id ? merged : e)), assignments: state.assignments };
        let impact: ImpactEntry[] = [];
        if (range) {
          impact = computeImpact(state, after, [id], range.from, range.to);
          const weeks = overbookedWeeks(after, state.assignments, id, range.from, range.to);
          if (weeks.length > 0) {
            warnings.push({
              code: 'OVERBOOKED',
              weeks,
              message: `${merged.name} ist in ${weeks.length} Woche(n) über 100 % ausgelastet: ${weeks.join(', ')}.`,
            });
          }
          if (!merged.active && own.length > 0) {
            warnings.push({
              code: 'INACTIVE_EMPLOYEE',
              message: `${merged.name} ist nicht aktiv, hat aber ${own.length} Einsatz/Einsätze.`,
            });
          }
        }
        if (opts.dryRun) return { ok: true, dryRun: true, result: merged, warnings, impact };
        const result = await repo.updateEmployee(id, patch);
        await commit('Person ändern', {
          type: 'update',
          entity: 'employee',
          id,
          patch: { ...patch },
          inverse: inversePatch(existing as unknown as Data, patch as Data),
        });
        return { ok: true, dryRun: false, result, warnings, impact };
      }),

    deleteEmployee: (id, opts = {}) =>
      serialize(async () => {
        const state = await getState();
        const existing = state.employees.find((e) => e.id === id);
        if (!existing) return notFound('employee', id);
        const cascade = state.assignments.filter((a) => a.employeeId === id);
        if (opts.dryRun) return { ok: true, dryRun: true, result: existing, warnings: [], impact: [] };
        await repo.deleteEmployee(id);
        await commit('Person löschen', { type: 'delete', entity: 'employee', id, data: withoutId(existing), cascade });
        return { ok: true, dryRun: false, result: existing, warnings: [], impact: [] };
      }),

    // ---- projects ------------------------------------------------------------------------

    createProject: (input, opts = {}) =>
      serialize(async () => {
        const { errors, warnings } = validateProject(input);
        if (errors.length > 0) return { ok: false, errors, warnings };
        if (opts.dryRun) return { ok: true, dryRun: true, result: { ...input, id: 'dry-run' }, warnings, impact: [] };
        const result = await repo.createProject(input);
        await commit('Projekt anlegen', { type: 'create', entity: 'project', id: result.id, data: withoutId(result) });
        return { ok: true, dryRun: false, result, warnings, impact: [] };
      }),

    updateProject: (id, patch, opts = {}) =>
      serialize(async () => {
        const state = await getState();
        const existing = state.projects.find((p) => p.id === id);
        if (!existing) return notFound('project', id);
        const merged: Project = { ...existing };
        for (const [k, v] of Object.entries(patch)) if (v !== undefined) (merged as unknown as Data)[k] = v;
        const { errors, warnings: projectWarnings } = validateProject(withoutId(merged) as unknown as ProjectInput);
        if (errors.length > 0) return { ok: false, errors, warnings: projectWarnings };
        const warnings: ValidationIssue[] = [...projectWarnings];
        const outside = state.assignments.filter(
          (a) => a.projectId === id && (a.start < merged.start || a.end > merged.end),
        );
        if (outside.length > 0) {
          warnings.push({
            code: 'OUTSIDE_PROJECT',
            message: `${outside.length} Einsatz/Einsätze liegen außerhalb der Projektlaufzeit von ${merged.name}.`,
          });
        }
        if (opts.dryRun) return { ok: true, dryRun: true, result: merged, warnings, impact: [] };
        const result = await repo.updateProject(id, patch);
        await commit('Projekt ändern', {
          type: 'update',
          entity: 'project',
          id,
          patch: { ...patch },
          inverse: inversePatch(existing as unknown as Data, patch as Data),
        });
        return { ok: true, dryRun: false, result, warnings, impact: [] };
      }),

    deleteProject: (id, opts = {}) =>
      serialize(async () => {
        const state = await getState();
        const existing = state.projects.find((p) => p.id === id);
        if (!existing) return notFound('project', id);
        const cascade = state.assignments.filter((a) => a.projectId === id);
        const range = span(cascade);
        const impact = range
          ? computeImpact(
              state,
              { employees: state.employees, assignments: state.assignments.filter((a) => a.projectId !== id) },
              cascade.map((a) => a.employeeId),
              range.from,
              range.to,
            )
          : [];
        if (opts.dryRun) return { ok: true, dryRun: true, result: existing, warnings: [], impact };
        await repo.deleteProject(id);
        await commit('Projekt löschen', { type: 'delete', entity: 'project', id, data: withoutId(existing), cascade });
        return { ok: true, dryRun: false, result: existing, warnings: [], impact };
      }),

    // ---- history -------------------------------------------------------------------------

    undo: () =>
      serialize(async () => {
        const entry = past.pop();
        if (!entry) return { ok: false, error: 'Nichts zum Rückgängigmachen.' };
        try {
          await applyOp(invert(entry.op));
        } catch (e) {
          await options.onChange?.();
          return { ok: false, label: entry.label, error: e instanceof Error ? e.message : String(e) };
        }
        future.push(entry);
        await options.onChange?.();
        return { ok: true, label: entry.label };
      }),

    redo: () =>
      serialize(async () => {
        const entry = future.pop();
        if (!entry) return { ok: false, error: 'Nichts zum Wiederherstellen.' };
        try {
          await applyOp(entry.op);
        } catch (e) {
          await options.onChange?.();
          return { ok: false, label: entry.label, error: e instanceof Error ? e.message : String(e) };
        }
        past.push(entry);
        await options.onChange?.();
        return { ok: true, label: entry.label };
      }),

    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    undoLabel: () => past[past.length - 1]?.label,
    redoLabel: () => future[future.length - 1]?.label,
    clearHistory: () => {
      past.length = 0;
      future.length = 0;
    },
  };

  return actions;
}
