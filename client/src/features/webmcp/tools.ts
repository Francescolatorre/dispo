/**
 * WebMCP tool definitions for the planning board (pure: no React, no DOM).
 *
 * Reads use the domain workload engine; writes go ONLY through `PlanningActions`
 * (validation, impact, undo history and the UI reload all live there).
 * Tools never throw for bad input: they return `{ ok: false, error, ... }` with a message
 * the agent can act on (e.g. "call list_employees").
 */
import type { ActionResult, ImpactEntry, PlanningActions } from '../../domain/planningActions';
import { addDays, addWeeks, isISODate, listWeeks, startOfISOWeek, weekStartFromKey } from '../../domain/dates';
import {
  PROJECT_STATUSES,
  type Assignment,
  type AssignmentUpdate,
  type Employee,
  type ISODate,
  type PlanningData,
  type Project,
} from '../../domain/types';
import type { ValidationIssue } from '../../domain/validation';
import { computeWorkloadMatrix, findFreeCapacity } from '../../domain/workload';
import { PROJECT_COLORS } from '../../domain/projectColors';
import { GUIDE_TOPICS, buildGuide, type GuideTopic } from './guide';
import type { JsonSchema, ModelContextTool, ToolResult } from './modelContext';

export interface PlanningToolContext extends PlanningData {
  actions: PlanningActions;
  /** Reference day (`YYYY-MM-DD`) for default date ranges. */
  today: ISODate;
}

export type PlanningToolContextGetter = () => PlanningToolContext | Promise<PlanningToolContext>;

export interface ToolWriteEvent {
  tool: string;
  /** `write` = applied change, `undo` = an undo was performed. */
  kind: 'write' | 'undo';
  /** History label of the action (`Einsatz anlegen`, …). */
  label: string;
  summary: string;
}

export interface PlanningToolHooks {
  /** Called after every applied (non-dry-run) write and every undo. */
  onWrite?: (event: ToolWriteEvent) => void;
}

/** Max weeks a read tool covers in one call (keeps responses small for the model). */
export const MAX_RANGE_WEEKS = 26;
const DEFAULT_RANGE_WEEKS = 8;

// ---- input helpers ---------------------------------------------------------------------

type Input = Record<string, unknown>;

class InputError extends Error {}

const DATE_OR_WEEK_PATTERN = '^(\\d{4}-\\d{2}-\\d{2}|\\d{4}-W\\d{2})$';
const WEEK_KEY_RE = /^\d{4}-W\d{2}$/;

const dateOrWeek = (description: string): JsonSchema => ({
  type: 'string',
  pattern: DATE_OR_WEEK_PATTERN,
  description: `${description} Format: Datum "YYYY-MM-DD" oder ISO-Woche "YYYY-Www" (z. B. "2026-W49").`,
});

function asObject(input: unknown): Input {
  if (input === undefined || input === null) return {};
  if (typeof input === 'string') {
    // Older Chrome builds passed JSON-stringified arguments.
    try {
      return asObject(JSON.parse(input));
    } catch {
      throw new InputError('Argumente müssen ein JSON-Objekt sein.');
    }
  }
  if (typeof input !== 'object' || Array.isArray(input)) throw new InputError('Argumente müssen ein JSON-Objekt sein.');
  return input as Input;
}

function checkKeys(input: Input, schema: JsonSchema): void {
  const allowed = Object.keys(schema.properties ?? {});
  const unknown = Object.keys(input).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    throw new InputError(`Unbekannte Parameter: ${unknown.join(', ')}. Erlaubt: ${allowed.join(', ') || '(keine)'}.`);
  }
  for (const key of schema.required ?? []) {
    if (input[key] === undefined || input[key] === null || input[key] === '') {
      throw new InputError(`Parameter "${key}" fehlt.`);
    }
  }
}

function optString(input: Input, key: string): string | undefined {
  const v = input[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw new InputError(`"${key}" muss ein Text sein.`);
  const trimmed = v.trim();
  return trimmed === '' ? undefined : trimmed;
}

function optBoolean(input: Input, key: string): boolean | undefined {
  const v = input[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'boolean') throw new InputError(`"${key}" muss true oder false sein.`);
  return v;
}

function optInteger(input: Input, key: string): number | undefined {
  const v = input[key];
  if (v === undefined || v === null) return undefined;
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isInteger(n)) throw new InputError(`"${key}" muss eine ganze Zahl sein.`);
  return n;
}

function optStringArray(input: Input, key: string): string[] | undefined {
  const v = input[key];
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) throw new InputError(`"${key}" muss eine Liste von Texten sein.`);
  return v as string[];
}

/**
 * `YYYY-MM-DD` or ISO week `YYYY-Www`. A week resolves to its Monday (`edge: 'start'`) or
 * its Friday (`edge: 'end'`, the last workday — assignments end on workdays).
 */
function parseDateInput(value: string, key: string, edge: 'start' | 'end'): ISODate {
  if (WEEK_KEY_RE.test(value)) {
    let monday: ISODate;
    try {
      monday = weekStartFromKey(value);
    } catch {
      throw new InputError(`"${key}": "${value}" ist keine gültige ISO-Woche (YYYY-Www, Woche 01–52/53).`);
    }
    return edge === 'start' ? monday : addDays(monday, 4);
  }
  if (isISODate(value)) return value;
  throw new InputError(`"${key}": "${value}" ist kein gültiges Datum. Erwartet "YYYY-MM-DD" oder ISO-Woche "YYYY-Www".`);
}

function optDate(input: Input, key: string, edge: 'start' | 'end'): ISODate | undefined {
  const s = optString(input, key);
  return s === undefined ? undefined : parseDateInput(s, key, edge);
}

/** [from, to] with defaults (this week + 7 weeks) and a size limit. */
function readRange(input: Input, today: ISODate): { from: ISODate; to: ISODate } {
  const from = optDate(input, 'from', 'start') ?? startOfISOWeek(today);
  const to = optDate(input, 'to', 'end') ?? addDays(addWeeks(startOfISOWeek(from), DEFAULT_RANGE_WEEKS - 1), 4);
  if (to < from) throw new InputError(`"to" (${to}) liegt vor "from" (${from}).`);
  const weeks = listWeeks(from, to).length;
  if (weeks > MAX_RANGE_WEEKS) {
    throw new InputError(`Zeitraum umfasst ${weeks} Wochen; maximal ${MAX_RANGE_WEEKS} pro Aufruf. Bitte in kleinere Abschnitte teilen.`);
  }
  return { from, to };
}

// ---- name resolution -------------------------------------------------------------------

const normalize = (s: string) => s.normalize('NFC').toLocaleLowerCase('de').replace(/\s+/g, ' ').trim();

type Resolution<T> = { ok: true; value: T } | { ok: false; result: ToolResult };

interface Named {
  id: string;
  name: string;
}

/**
 * By id, else by name: exact (case-insensitive) match first, then substring match.
 * Ambiguous or missing names yield an error result with candidates.
 */
function resolveByIdOrName<T extends Named>(
  items: readonly T[],
  id: string | undefined,
  name: string | undefined,
  kind: { label: string; idParam: string; nameParam: string; listTool: string },
  describe: (item: T) => Record<string, unknown>,
): Resolution<T> {
  if (id !== undefined) {
    const found = items.find((i) => i.id === id);
    if (found) return { ok: true, value: found };
    return {
      ok: false,
      result: failure(`${kind.label} mit ID "${id}" nicht gefunden. Rufe ${kind.listTool} auf, um gültige IDs zu sehen.`),
    };
  }
  if (name === undefined) {
    return { ok: false, result: failure(`Bitte "${kind.idParam}" oder "${kind.nameParam}" angeben.`) };
  }
  const q = normalize(name);
  const exact = items.filter((i) => normalize(i.name) === q);
  const matches = exact.length > 0 ? exact : items.filter((i) => normalize(i.name).includes(q));
  if (matches.length === 1) return { ok: true, value: matches[0] };
  if (matches.length === 0) {
    return {
      ok: false,
      result: failure(`Kein(e) ${kind.label} mit Namen "${name}" gefunden. Rufe ${kind.listTool} auf und verwende "${kind.idParam}".`),
    };
  }
  return {
    ok: false,
    result: failure(
      `"${name}" ist mehrdeutig (${matches.length} Treffer). Bitte mit "${kind.idParam}" eines der Kandidaten wiederholen.`,
      { candidates: matches.map(describe) },
    ),
  };
}

const describeEmployee = (e: Employee) => ({ id: e.id, name: e.name, role: e.role, active: e.active });
const describeProject = (p: Project) => ({ id: p.id, name: p.name, status: p.status, start: p.start, end: p.end });

function resolveEmployee(ctx: PlanningToolContext, id: string | undefined, name: string | undefined) {
  return resolveByIdOrName(
    ctx.employees,
    id,
    name,
    { label: 'Person', idParam: 'employeeId', nameParam: 'employeeName', listTool: 'list_employees' },
    describeEmployee,
  );
}

function resolveProject(ctx: PlanningToolContext, id: string | undefined, name: string | undefined) {
  return resolveByIdOrName(
    ctx.projects,
    id,
    name,
    { label: 'Projekt', idParam: 'projectId', nameParam: 'projectName', listTool: 'list_projects' },
    describeProject,
  );
}

// ---- result helpers --------------------------------------------------------------------

function failure(error: string, extra: Record<string, unknown> = {}): ToolResult {
  return { ok: false, error, ...extra };
}

const issueText = (issues: readonly ValidationIssue[]) => issues.map((i) => i.message);

function describeImpact(ctx: PlanningToolContext, impact: readonly ImpactEntry[]) {
  const names = new Map(ctx.employees.map((e) => [e.id, e.name]));
  return impact.map((i) => ({
    employeeId: i.employeeId,
    employeeName: names.get(i.employeeId) ?? i.employeeId,
    week: i.weekKey,
    weekStart: i.weekStart,
    utilizationBefore: i.before,
    utilizationAfter: i.after,
    statusBefore: i.beforeStatus,
    statusAfter: i.afterStatus,
  }));
}

function describeAssignment(ctx: PlanningToolContext, a: Assignment, includeId = true) {
  const employee = ctx.employees.find((e) => e.id === a.employeeId);
  const project = ctx.projects.find((p) => p.id === a.projectId);
  return {
    ...(includeId ? { id: a.id } : {}),
    employeeId: a.employeeId,
    employeeName: employee?.name ?? a.employeeId,
    projectId: a.projectId,
    projectName: project?.name ?? a.projectId,
    start: a.start,
    end: a.end,
    allocation: a.allocation,
    ...(a.role ? { role: a.role } : {}),
  };
}

/** One sentence about overbooking after the change, or ''. */
function overbookingNote(result: ActionResult<Assignment>): string {
  if (!result.ok) return '';
  const over = result.warnings.find((w) => w.code === 'OVERBOOKED');
  return over?.weeks?.length ? ` Achtung: in ${over.weeks.length} Woche(n) über 100 % ausgelastet.` : '';
}

function writeResult(
  ctx: PlanningToolContext,
  result: ActionResult<Assignment>,
  summary: (a: Assignment) => string,
  extra: Record<string, unknown> = {},
): ToolResult {
  if (!result.ok) {
    return {
      ok: false,
      error: 'Änderung nicht möglich: ' + issueText(result.errors).join(' '),
      errors: result.errors.map((e) => ({ code: e.code, field: e.field, message: e.message })),
      warnings: issueText(result.warnings),
    };
  }
  const prefix = result.dryRun ? 'Vorschau (nicht gespeichert): ' : '';
  return {
    ok: true,
    dryRun: result.dryRun,
    summary: prefix + summary(result.result) + overbookingNote(result),
    assignment: describeAssignment(ctx, result.result, !result.dryRun || result.result.id !== 'dry-run'),
    warnings: issueText(result.warnings),
    impact: describeImpact(ctx, result.impact),
    ...(result.dryRun ? {} : { undoLabel: ctx.actions.undoLabel(), undoHint: 'Rückgängig machen mit undo_last_change.' }),
    ...extra,
  };
}

const range = (a: Pick<Assignment, 'start' | 'end'>) => `${a.start} bis ${a.end}`;

// ---- schemas ---------------------------------------------------------------------------

const STATUS_HINT =
  '"status" ist die Auslastungs-Ampel des Boards, abgeleitet aus "utilization" ("free" = nichts geplant, "over" = über 100 % der eigenen Kapazität; Zwischenstufen wie im Board).';

const UNITS_HINT =
  '"load" und "freePercent" sind Prozent einer Vollzeitwoche (FTE-%), "utilization" ist Prozent der eigenen Kapazität der Person (Teilzeit berücksichtigt).';

const SCHEMAS = {
  get_guide: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        enum: [...GUIDE_TOPICS],
        description:
          'Abschnitt des Leitfadens: "all" (Standard), "overview" (Zweck, gelöste Probleme), "concepts" (Begriffe, Einheiten, Ampel), "workflow" (Vorgehen, Rezepte), "sops" (verbindliche Regeln), "pitfalls" (typische Fehler), "tools" (Werkzeugübersicht).',
        default: 'all',
      },
    },
    additionalProperties: false,
  },
  list_employees: {
    type: 'object',
    properties: {
      role: { type: 'string', description: 'Nur Personen mit dieser Rolle (exakt, Groß-/Kleinschreibung egal), z. B. "Frontend", "Backend", "Design", "PM", "QA", "DevOps".' },
      activeOnly: { type: 'boolean', description: 'Nur aktive Personen (Standard: true).', default: true },
      query: { type: 'string', description: 'Teil des Namens, z. B. "Anna".' },
    },
    additionalProperties: false,
  },
  list_projects: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: PROJECT_STATUSES, description: 'Nur Projekte mit diesem Status.' },
      query: { type: 'string', description: 'Teil des Projektnamens.' },
    },
    additionalProperties: false,
  },
  get_workload: {
    type: 'object',
    properties: {
      from: dateOrWeek('Beginn des Zeitraums (Standard: Montag dieser Woche).'),
      to: dateOrWeek(`Ende des Zeitraums (Standard: 8 Wochen ab "from"; max. ${MAX_RANGE_WEEKS} Wochen).`),
      employeeIds: { type: 'array', items: { type: 'string' }, description: 'Nur diese Personen (IDs aus list_employees). Standard: alle aktiven.' },
    },
    additionalProperties: false,
  },
  find_free_capacity: {
    type: 'object',
    properties: {
      from: dateOrWeek('Beginn des Zeitraums (Standard: Montag dieser Woche).'),
      to: dateOrWeek(`Ende des Zeitraums (Standard: 8 Wochen ab "from"; max. ${MAX_RANGE_WEEKS} Wochen).`),
      minFreePercent: { type: 'integer', minimum: 0, maximum: 100, default: 20, description: 'Mindestens so viel freie Kapazität (FTE-%) in JEDER Woche des Zeitraums. Standard 20.' },
      role: { type: 'string', description: 'Nur Personen mit dieser Rolle, z. B. "Frontend".' },
    },
    additionalProperties: false,
  },
  create_assignment: {
    type: 'object',
    properties: {
      employeeId: { type: 'string', description: 'ID der Person (aus list_employees). Alternativ employeeName.' },
      employeeName: { type: 'string', description: 'Name der Person, wenn keine ID bekannt ist; muss eindeutig sein.' },
      projectId: { type: 'string', description: 'ID des Projekts (aus list_projects). Alternativ projectName.' },
      projectName: { type: 'string', description: 'Projektname, wenn keine ID bekannt ist; muss eindeutig sein.' },
      start: dateOrWeek('Erster Tag des Einsatzes (eine Woche = deren Montag).'),
      end: dateOrWeek('Letzter Tag des Einsatzes, inklusiv (eine Woche = deren Freitag).'),
      allocation: { type: 'integer', minimum: 10, maximum: 100, multipleOf: 10, description: 'Anteil einer Vollzeitwoche in %, 10–100 in 10er-Schritten.' },
      role: { type: 'string', description: 'Optionale Rolle im Projekt, z. B. "Frontend".' },
      dryRun: { type: 'boolean', default: false, description: 'true = nur prüfen und Auswirkung zeigen, nichts speichern.' },
    },
    required: ['start', 'end', 'allocation'],
    additionalProperties: false,
  },
  create_project: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Projektname, z. B. "Web CRM aufbauen". Muss eindeutig sein.' },
      start: dateOrWeek('Projektstart.'),
      end: dateOrWeek('Projektende (inklusiv).'),
      status: {
        type: 'string',
        enum: [...PROJECT_STATUSES],
        description: 'Optional. Standard: "active", wenn der Start heute oder früher ist, sonst "planned".',
      },
      color: {
        type: 'string',
        enum: [...PROJECT_COLORS],
        description: 'Optional. Standard: eine Palettenfarbe, die noch kein Projekt nutzt.',
      },
      dryRun: { type: 'boolean', default: false, description: 'true = nur prüfen, nichts speichern.' },
    },
    required: ['name', 'start', 'end'],
    additionalProperties: false,
  },
  update_assignment: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID des Einsatzes (aus get_workload → assignments).' },
      start: dateOrWeek('Neuer erster Tag.'),
      end: dateOrWeek('Neuer letzter Tag (inklusiv).'),
      shiftWeeks: { type: 'integer', description: 'Verschiebt Start und Ende um so viele Wochen (negativ = früher). Nicht zusammen mit start/end.' },
      allocation: { type: 'integer', minimum: 10, maximum: 100, multipleOf: 10, description: 'Neuer Anteil in %, 10–100 in 10er-Schritten.' },
      role: { type: 'string', description: 'Neue Rolle im Projekt; leerer Text entfernt die Rolle.' },
      employeeId: { type: 'string', description: 'Einsatz an diese Person übergeben (ID). Alternativ employeeName.' },
      employeeName: { type: 'string', description: 'Einsatz an diese Person übergeben (eindeutiger Name).' },
      dryRun: { type: 'boolean', default: false, description: 'true = nur prüfen und Auswirkung zeigen, nichts speichern.' },
    },
    required: ['id'],
    additionalProperties: false,
  },
  delete_assignment: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID des Einsatzes (aus get_workload → assignments).' },
      dryRun: { type: 'boolean', default: false, description: 'true = nur Auswirkung zeigen, nichts löschen.' },
    },
    required: ['id'],
    additionalProperties: false,
  },
  undo_last_change: {
    type: 'object',
    properties: {
      expectedLabel: {
        type: 'string',
        description: 'Optional: "undoLabel" aus der Antwort des Schreib-Werkzeugs. Wird nur rückgängig gemacht, wenn die letzte Änderung noch diese ist.',
      },
    },
    additionalProperties: false,
  },
} satisfies Record<string, JsonSchema>;

export type PlanningToolName = keyof typeof SCHEMAS;
export const PLANNING_TOOL_NAMES = Object.keys(SCHEMAS) as PlanningToolName[];

// ---- factory ---------------------------------------------------------------------------

type Handler = (ctx: PlanningToolContext, input: Input) => Promise<ToolResult> | ToolResult;

interface ToolSpec {
  name: PlanningToolName;
  title: string;
  description: string;
  readOnly: boolean;
  consequential?: boolean;
  handler: Handler;
}

export function createPlanningTools(getContext: PlanningToolContextGetter, hooks: PlanningToolHooks = {}): ModelContextTool[] {
  const notify = (event: ToolWriteEvent) => {
    try {
      hooks.onWrite?.(event);
    } catch {
      // UI feedback must never fail a tool call.
    }
  };

  const specs: ToolSpec[] = [
    {
      name: 'get_guide',
      title: 'Leitfaden für Agenten',
      description:
        'ZUERST AUFRUFEN. Erklärt, welche Probleme Dispo löst, die Begriffe und Einheiten (FTE-% vs. Auslastung, Ampel), das empfohlene Vorgehen ' +
        '(lesen → dryRun → schreiben → berichten), verbindliche SOPs (z. B. keine Überbuchung ohne Auftrag, Projektlaufzeit respektieren) und typische Fehler. ' +
        'Optional topic für einen einzelnen Abschnitt.',
      readOnly: true,
      handler: (ctx, input) => {
        const topic = optString(input, 'topic') ?? 'all';
        if (!(GUIDE_TOPICS as readonly string[]).includes(topic)) {
          return failure(`Unbekanntes topic "${topic}". Erlaubt: ${GUIDE_TOPICS.join(', ')}.`);
        }
        return { ok: true, topic, guide: buildGuide(topic as GuideTopic, ctx.today) };
      },
    },
    {
      name: 'list_employees',
      title: 'Personen auflisten',
      description:
        'Listet die Personen der Ressourcenplanung mit id, name, role, seniority, capacity (Teilzeitfaktor 0.1–1.0) und active. ' +
        'Verwende es, um IDs für andere Werkzeuge zu finden. Standardmäßig nur aktive Personen.',
      readOnly: true,
      handler: (ctx, input) => {
        const role = optString(input, 'role')?.toLowerCase();
        const activeOnly = optBoolean(input, 'activeOnly') ?? true;
        const query = optString(input, 'query');
        const q = query ? normalize(query) : undefined;
        const employees = ctx.employees
          .filter((e) => (!activeOnly || e.active) && (!role || e.role.toLowerCase() === role) && (!q || normalize(e.name).includes(q)))
          .sort((a, b) => a.name.localeCompare(b.name, 'de'))
          .map((e) => ({ id: e.id, name: e.name, role: e.role, seniority: e.seniority, capacity: e.capacity, active: e.active }));
        return { ok: true, count: employees.length, employees };
      },
    },
    {
      name: 'list_projects',
      title: 'Projekte auflisten',
      description:
        'Listet Projekte mit id, name, status ("planned" | "active" | "done"), start und end (YYYY-MM-DD) sowie der Anzahl Einsätze. ' +
        'Verwende es, um Projekt-IDs für create_assignment zu finden.',
      readOnly: true,
      handler: (ctx, input) => {
        const status = optString(input, 'status');
        if (status !== undefined && !(PROJECT_STATUSES as readonly string[]).includes(status)) {
          return failure(`Unbekannter Status "${status}". Erlaubt: ${PROJECT_STATUSES.join(', ')}.`);
        }
        const query = optString(input, 'query');
        const q = query ? normalize(query) : undefined;
        const projects = ctx.projects
          .filter((p) => (!status || p.status === status) && (!q || normalize(p.name).includes(q)))
          .sort((a, b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name, 'de'))
          .map((p) => ({
            ...describeProject(p),
            assignmentCount: ctx.assignments.filter((a) => a.projectId === p.id).length,
          }));
        return { ok: true, count: projects.length, projects };
      },
    },
    {
      name: 'get_workload',
      title: 'Auslastung abfragen',
      description:
        'Liefert die Auslastung je Person und ISO-Woche im Zeitraum: employees[].weeks[] mit load, utilization, freePercent, status und assignmentIds (nur IDs). ' +
        'Die vollständigen Einsätze jeder Person im Zeitraum stehen in employees[].assignments[] (mit id für update_assignment/delete_assignment). ' +
        `${UNITS_HINT} ${STATUS_HINT}`,
      readOnly: true,
      handler: (ctx, input) => {
        const { from, to } = readRange(input, ctx.today);
        const ids = optStringArray(input, 'employeeIds');
        let employees: Employee[];
        if (ids && ids.length > 0) {
          const unknown = ids.filter((id) => !ctx.employees.some((e) => e.id === id));
          if (unknown.length > 0) {
            return failure(`Unbekannte Personen-IDs: ${unknown.join(', ')}. Rufe list_employees auf.`);
          }
          employees = ctx.employees.filter((e) => ids.includes(e.id));
        } else {
          employees = ctx.employees.filter((e) => e.active);
        }
        const weeks = listWeeks(from, to);
        const matrix = computeWorkloadMatrix(employees, ctx.assignments, weeks);
        return {
          ok: true,
          from,
          to,
          weeks: weeks.map((w) => w.key),
          employees: employees.map((e) => ({
            employeeId: e.id,
            name: e.name,
            role: e.role,
            capacity: e.capacity,
            weeks: weeks.map((w) => {
              const l = matrix[e.id][w.key];
              return {
                week: w.key,
                weekStart: w.start,
                load: l.load,
                utilization: l.utilization,
                freePercent: l.freePercent,
                status: l.status,
                assignmentIds: l.assignmentIds,
              };
            }),
            assignments: ctx.assignments
              .filter((a) => a.employeeId === e.id && a.start <= to && a.end >= from)
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((a) => describeAssignment(ctx, a)),
          })),
        };
      },
    },
    {
      name: 'find_free_capacity',
      title: 'Freie Kapazität finden',
      description:
        'Findet aktive Personen, die in JEDER Woche des Zeitraums mindestens minFreePercent (FTE-%) frei haben, sortiert nach freier Kapazität (absteigend). ' +
        'Optional nach Rolle gefiltert. Liefert je Person minFreePercent, avgFreePercent und die Wochenwerte. ' +
        STATUS_HINT,
      readOnly: true,
      handler: (ctx, input) => {
        const { from, to } = readRange(input, ctx.today);
        const minFreePercent = optInteger(input, 'minFreePercent') ?? 20;
        if (minFreePercent < 0 || minFreePercent > 100) return failure('"minFreePercent" muss zwischen 0 und 100 liegen.');
        const role = optString(input, 'role');
        const results = findFreeCapacity(ctx.employees, ctx.assignments, { from, to, minFreePercent, role });
        return {
          ok: true,
          from,
          to,
          minFreePercent,
          count: results.length,
          candidates: results.map((r) => ({
            employeeId: r.employee.id,
            name: r.employee.name,
            role: r.employee.role,
            seniority: r.employee.seniority,
            capacity: r.employee.capacity,
            minFreePercent: r.minFreePercent,
            avgFreePercent: r.avgFreePercent,
            weeks: r.weeks.map((w) => ({ week: w.weekKey, freePercent: w.freePercent, utilization: w.utilization, status: w.status })),
          })),
          ...(results.length === 0 ? { hint: 'Niemand erfüllt die Bedingung. minFreePercent senken, Zeitraum verkürzen oder Rolle weglassen.' } : {}),
        };
      },
    },
    {
      name: 'create_assignment',
      title: 'Einsatz anlegen',
      description:
        'Legt sofort einen Einsatz an: Person (employeeId oder eindeutiger employeeName) arbeitet von start bis end mit allocation % auf einem Projekt (projectId oder projectName). ' +
        'Mit dryRun=true wird nur geprüft und die Auswirkung gezeigt. Überbuchung (>100 %) ist erlaubt, erscheint aber als Warnung. ' +
        'Antwort: ok, summary, warnings, impact (Auslastung je Woche vorher/nachher mit Status), undoLabel. Die Änderung ist sofort im Board sichtbar.',
      readOnly: false,
      handler: async (ctx, input) => {
        const employee = resolveEmployee(ctx, optString(input, 'employeeId'), optString(input, 'employeeName'));
        if (!employee.ok) return employee.result;
        const project = resolveProject(ctx, optString(input, 'projectId'), optString(input, 'projectName'));
        if (!project.ok) return project.result;
        const start = optDate(input, 'start', 'start') as ISODate;
        const end = optDate(input, 'end', 'end') as ISODate;
        const allocation = optInteger(input, 'allocation') as number;
        const role = optString(input, 'role');
        const dryRun = optBoolean(input, 'dryRun') ?? false;
        const result = await ctx.actions.createAssignment(
          { employeeId: employee.value.id, projectId: project.value.id, start, end, allocation, ...(role ? { role } : {}) },
          { dryRun },
        );
        const out = writeResult(
          ctx,
          result,
          (a) => `${employee.value.name} wird ${range(a)} mit ${a.allocation} % auf ${project.value.name} eingeplant.`,
        );
        if (result.ok && !dryRun) notify({ tool: 'create_assignment', kind: 'write', label: 'Einsatz anlegen', summary: String(out.summary) });
        return out;
      },
    },
    {
      name: 'update_assignment',
      title: 'Einsatz ändern',
      description:
        'Ändert einen bestehenden Einsatz (id aus get_workload) sofort: neues start/end, Verschieben um shiftWeeks Wochen, neue allocation, role, ' +
        'oder Übergabe an eine andere Person (employeeId/employeeName). Nur angegebene Felder ändern sich. dryRun=true = nur Vorschau. ' +
        'Antwort: ok, summary, warnings, impact (vorher/nachher je Woche mit Status), undoLabel.',
      readOnly: false,
      handler: async (ctx, input) => {
        const id = optString(input, 'id') as string;
        const existing = ctx.assignments.find((a) => a.id === id);
        if (!existing) return failure(`Einsatz "${id}" nicht gefunden. Rufe get_workload auf, um Einsatz-IDs zu sehen.`);

        const start = optDate(input, 'start', 'start');
        const end = optDate(input, 'end', 'end');
        const shiftWeeks = optInteger(input, 'shiftWeeks');
        const allocation = optInteger(input, 'allocation');
        const roleRaw = input.role;
        if (roleRaw !== undefined && roleRaw !== null && typeof roleRaw !== 'string') return failure('"role" muss ein Text sein.');
        const dryRun = optBoolean(input, 'dryRun') ?? false;
        if (shiftWeeks !== undefined && (start !== undefined || end !== undefined)) {
          return failure('"shiftWeeks" kann nicht zusammen mit "start"/"end" verwendet werden.');
        }

        const employeeIdIn = optString(input, 'employeeId');
        const employeeNameIn = optString(input, 'employeeName');
        let employee: Employee | undefined;
        if (employeeIdIn !== undefined || employeeNameIn !== undefined) {
          const r = resolveEmployee(ctx, employeeIdIn, employeeNameIn);
          if (!r.ok) return r.result;
          employee = r.value;
        }

        const patch: AssignmentUpdate = {};
        if (start !== undefined) patch.start = start;
        if (end !== undefined) patch.end = end;
        if (shiftWeeks !== undefined && shiftWeeks !== 0) {
          patch.start = addWeeks(existing.start, shiftWeeks);
          patch.end = addWeeks(existing.end, shiftWeeks);
        }
        if (allocation !== undefined) patch.allocation = allocation;
        if (typeof roleRaw === 'string') patch.role = roleRaw.trim() === '' ? null : roleRaw.trim();
        if (employee && employee.id !== existing.employeeId) patch.employeeId = employee.id;
        if (Object.keys(patch).length === 0) {
          return failure('Keine Änderung angegeben. Mindestens eines von start, end, shiftWeeks, allocation, role, employeeId/employeeName setzen.');
        }

        // Pure moves (shift and/or hand-over) use the move action so history/toasts read "verschieben".
        const isMove = Object.keys(patch).every((k) => k === 'start' || k === 'end' || k === 'employeeId') && start === undefined && end === undefined;
        const result = isMove
          ? await ctx.actions.moveAssignment(id, { weeks: shiftWeeks ?? 0, employeeId: patch.employeeId }, { dryRun })
          : await ctx.actions.updateAssignment(id, patch, { dryRun });
        const label = isMove ? 'Einsatz verschieben' : 'Einsatz ändern';
        const out = writeResult(ctx, result, (a) => {
          const name = ctx.employees.find((e) => e.id === a.employeeId)?.name ?? a.employeeId;
          const projectName = ctx.projects.find((p) => p.id === a.projectId)?.name ?? a.projectId;
          return `Einsatz ${projectName} ${isMove ? 'verschoben' : 'geändert'}: ${name}, ${range(a)}, ${a.allocation} %.`;
        });
        if (result.ok && !dryRun) notify({ tool: 'update_assignment', kind: 'write', label, summary: String(out.summary) });
        return out;
      },
    },
    {
      name: 'delete_assignment',
      title: 'Einsatz löschen',
      description:
        'Löscht einen Einsatz (id aus get_workload) sofort. Vorher die Zustimmung der Person einholen. ' +
        'Kann direkt danach mit undo_last_change rückgängig gemacht werden. dryRun=true zeigt nur die Auswirkung. ' +
        'Antwort: ok, summary, impact (vorher/nachher je Woche mit Status), undoLabel.',
      readOnly: false,
      consequential: true,
      handler: async (ctx, input) => {
        const id = optString(input, 'id') as string;
        const dryRun = optBoolean(input, 'dryRun') ?? false;
        if (!ctx.assignments.some((a) => a.id === id)) {
          return failure(`Einsatz "${id}" nicht gefunden. Rufe get_workload auf, um Einsatz-IDs zu sehen.`);
        }
        const result = await ctx.actions.deleteAssignment(id, { dryRun });
        const out = writeResult(ctx, result, (a) => {
          const d = describeAssignment(ctx, a);
          return `Einsatz von ${d.employeeName} auf ${d.projectName} (${range(a)}, ${a.allocation} %) ${dryRun ? 'würde gelöscht' : 'gelöscht'}.`;
        });
        if (result.ok && !dryRun) notify({ tool: 'delete_assignment', kind: 'write', label: 'Einsatz löschen', summary: String(out.summary) });
        return out;
      },
    },
    {
      name: 'create_project',
      title: 'Projekt anlegen',
      description:
        'Legt ein neues Projekt an (Name, Laufzeit, optional Status und Farbe), damit danach mit create_assignment Personen eingeplant werden können. ' +
        'Nur auf ausdrücklichen Wunsch des Nutzers; erst mit dryRun prüfen. Namen müssen eindeutig sein – existiert ein ähnliches Projekt, wird es gemeldet. ' +
        'Rückgängig mit undo_last_change.',
      readOnly: false,
      handler: async (ctx, input) => {
        const name = optString(input, 'name');
        if (!name) return failure('Parameter "name" fehlt.');
        const start = optDate(input, 'start', 'start');
        const end = optDate(input, 'end', 'end');
        if (!start || !end) return failure('Parameter "start" und "end" sind erforderlich.');
        const dryRun = optBoolean(input, 'dryRun') ?? false;
        const q = normalize(name);
        const same = ctx.projects.find((p) => normalize(p.name) === q);
        if (same) {
          return failure(`Ein Projekt "${same.name}" existiert bereits. Verwende es (projectId "${same.id}") statt ein neues anzulegen.`, {
            existing: describeProject(same),
          });
        }
        const similar = ctx.projects.filter((p) => normalize(p.name).includes(q) || q.includes(normalize(p.name)));
        const status = optString(input, 'status') ?? (start <= ctx.today ? 'active' : 'planned');
        if (!(PROJECT_STATUSES as readonly string[]).includes(status)) {
          return failure(`Unbekannter Status "${status}". Erlaubt: ${PROJECT_STATUSES.join(', ')}.`);
        }
        const used = new Set(ctx.projects.map((p) => p.color));
        const color =
          optString(input, 'color') ?? PROJECT_COLORS.find((c) => !used.has(c)) ?? PROJECT_COLORS[ctx.projects.length % PROJECT_COLORS.length];
        const result = await ctx.actions.createProject(
          { name, start, end, status: status as Project['status'], color },
          { dryRun },
        );
        if (!result.ok) {
          return {
            ok: false,
            error: 'Projekt nicht angelegt: ' + issueText(result.errors).join(' '),
            errors: result.errors.map((e) => ({ code: e.code, field: e.field, message: e.message })),
            warnings: issueText(result.warnings),
          };
        }
        const summary = `${dryRun ? 'Vorschau (nicht gespeichert): ' : ''}Projekt "${name}" (${start} bis ${end}, ${status}) ${dryRun ? 'würde angelegt' : 'angelegt'}.`;
        if (!dryRun) notify({ tool: 'create_project', kind: 'write', label: 'Projekt anlegen', summary });
        return {
          ok: true,
          dryRun,
          summary,
          project: dryRun ? { name, start, end, status, color } : describeProject(result.result),
          warnings: [
            ...issueText(result.warnings),
            ...(similar.length > 0 ? [`Ähnliche Projekte existieren bereits: ${similar.map((p) => p.name).join(', ')}.`] : []),
          ],
          nextStep: 'Personen mit find_free_capacity suchen und mit create_assignment (projectId oder projectName) einplanen.',
          ...(dryRun ? {} : { undoLabel: ctx.actions.undoLabel(), undoHint: 'Rückgängig machen mit undo_last_change.' }),
        };
      },
    },
    {
      name: 'undo_last_change',
      title: 'Letzte Änderung rückgängig machen',
      description:
        'Macht die zuletzt gespeicherte Änderung der Planung rückgängig (egal ob durch das Werkzeug oder in der Oberfläche vorgenommen). ' +
        'Mit expectedLabel (undoLabel aus der Schreib-Antwort) nur dann, wenn die letzte Änderung noch diese ist.',
      readOnly: false,
      consequential: true,
      handler: async (ctx, input) => {
        const expected = optString(input, 'expectedLabel');
        const current = ctx.actions.undoLabel();
        if (!current) return failure('Es gibt nichts rückgängig zu machen.');
        if (expected !== undefined && expected !== current) {
          return failure(`Die letzte Änderung ist "${current}", nicht "${expected}". Nichts rückgängig gemacht.`, { lastChange: current });
        }
        const result = await ctx.actions.undo();
        if (!result.ok) return failure(`Rückgängig fehlgeschlagen: ${result.error ?? 'unbekannter Fehler'}`);
        const summary = `Rückgängig gemacht: ${result.label ?? current}.`;
        notify({ tool: 'undo_last_change', kind: 'undo', label: result.label ?? current, summary });
        return { ok: true, summary, undone: result.label ?? current, nextUndo: ctx.actions.undoLabel() ?? null };
      },
    },
  ];

  const order = (s: ToolSpec) => PLANNING_TOOL_NAMES.indexOf(s.name);
  return [...specs].sort((a, b) => order(a) - order(b)).map((spec) => {
    const schema: JsonSchema = SCHEMAS[spec.name];
    return {
      name: spec.name,
      title: spec.title,
      description: spec.description,
      inputSchema: schema,
      annotations: {
        readOnlyHint: spec.readOnly,
        ...(spec.consequential ? { consequentialHint: true } : {}),
      },
      async execute(rawInput: unknown) {
        try {
          const input = asObject(rawInput);
          checkKeys(input, schema);
          const ctx = await getContext();
          return await spec.handler(ctx, input);
        } catch (e) {
          if (e instanceof InputError) return failure(e.message);
          return failure(`Interner Fehler in ${spec.name}: ${e instanceof Error ? e.message : String(e)}`);
        }
      },
    } satisfies ModelContextTool;
  });
}
