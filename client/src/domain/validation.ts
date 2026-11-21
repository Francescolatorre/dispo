/**
 * Validation for writes.
 *
 * - `errors` are BLOCKING: the write must not happen (bad dates, allocation, unknown refs).
 * - `warnings` are NON-BLOCKING: the planner decides (overbooking, outside project dates,
 *   inactive employee). Overbooking is shown, never prevented.
 */
import { isISODate, listWeeks } from './dates';
import { isProjectColor, PROJECT_COLORS } from './projectColors';
import {
  PROJECT_STATUSES,
  SENIORITIES,
  type Assignment,
  type AssignmentInput,
  type EmployeeInput,
  type PlanningData,
  type ProjectInput,
  type WeekKey,
} from './types';
import { computeWeekLoad } from './workload';

export type ValidationCode =
  | 'INVALID_DATE'
  | 'END_BEFORE_START'
  | 'ALLOCATION_RANGE'
  | 'ALLOCATION_STEP'
  | 'UNKNOWN_EMPLOYEE'
  | 'UNKNOWN_PROJECT'
  | 'NOT_FOUND'
  | 'REQUIRED'
  | 'INVALID_VALUE'
  | 'CAPACITY_RANGE'
  | 'OVERBOOKED'
  | 'OUTSIDE_PROJECT'
  | 'INACTIVE_EMPLOYEE'
  | 'COLOR_NOT_IN_PALETTE';

export interface ValidationIssue {
  code: ValidationCode;
  message: string;
  field?: string;
  /** For OVERBOOKED: affected ISO weeks. */
  weeks?: WeekKey[];
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export const ALLOCATION_MIN = 10;
export const ALLOCATION_MAX = 100;
export const ALLOCATION_STEP = 10;
export const CAPACITY_MIN = 0.1;
export const CAPACITY_MAX = 1;

function validateRange(start: unknown, end: unknown, errors: ValidationIssue[]): boolean {
  let ok = true;
  if (!isISODate(start)) {
    errors.push({ code: 'INVALID_DATE', field: 'start', message: 'Startdatum ist kein gültiges Datum (YYYY-MM-DD).' });
    ok = false;
  }
  if (!isISODate(end)) {
    errors.push({ code: 'INVALID_DATE', field: 'end', message: 'Enddatum ist kein gültiges Datum (YYYY-MM-DD).' });
    ok = false;
  }
  if (ok && (end as string) < (start as string)) {
    errors.push({ code: 'END_BEFORE_START', field: 'end', message: 'Enddatum liegt vor dem Startdatum.' });
    ok = false;
  }
  return ok;
}

/** ISO weeks in which `employeeId` would exceed 100 % utilization, given `assignments`. */
export function overbookedWeeks(
  data: Pick<PlanningData, 'employees'>,
  assignments: readonly Assignment[],
  employeeId: string,
  from: string,
  to: string,
): WeekKey[] {
  const employee = data.employees.find((e) => e.id === employeeId);
  if (!employee) return [];
  return listWeeks(from, to)
    .map((w) => computeWeekLoad(employee, assignments, w))
    .filter((l) => l.status === 'over')
    .map((l) => l.weekKey);
}

/**
 * Validates an assignment as it would look after the write.
 * `excludeId`: id of the assignment being updated (its old version is replaced, not added).
 */
export function validateAssignment(
  input: AssignmentInput,
  data: PlanningData,
  excludeId?: string,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const rangeOk = validateRange(input.start, input.end, errors);

  const { allocation } = input;
  if (typeof allocation !== 'number' || !Number.isFinite(allocation) || allocation < ALLOCATION_MIN || allocation > ALLOCATION_MAX) {
    errors.push({
      code: 'ALLOCATION_RANGE',
      field: 'allocation',
      message: `Allokation muss zwischen ${ALLOCATION_MIN} und ${ALLOCATION_MAX} % liegen.`,
    });
  } else if (allocation % ALLOCATION_STEP !== 0) {
    errors.push({
      code: 'ALLOCATION_STEP',
      field: 'allocation',
      message: `Allokation muss in ${ALLOCATION_STEP}er-Schritten angegeben werden.`,
    });
  }

  const employee = data.employees.find((e) => e.id === input.employeeId);
  if (!employee) {
    errors.push({ code: 'UNKNOWN_EMPLOYEE', field: 'employeeId', message: `Unbekannte Person "${input.employeeId}".` });
  }
  const project = data.projects.find((p) => p.id === input.projectId);
  if (!project) {
    errors.push({ code: 'UNKNOWN_PROJECT', field: 'projectId', message: `Unbekanntes Projekt "${input.projectId}".` });
  }

  if (errors.length > 0 || !rangeOk) return { errors, warnings };

  if (employee && !employee.active) {
    warnings.push({ code: 'INACTIVE_EMPLOYEE', field: 'employeeId', message: `${employee.name} ist nicht aktiv.` });
  }
  if (project && (input.start < project.start || input.end > project.end)) {
    warnings.push({
      code: 'OUTSIDE_PROJECT',
      message: `Einsatz liegt außerhalb der Projektlaufzeit von ${project.name} (${project.start} – ${project.end}).`,
    });
  }

  const after: Assignment[] = data.assignments.filter((a) => a.id !== excludeId);
  after.push({ ...input, id: excludeId ?? '__draft__' });
  const weeks = overbookedWeeks(data, after, input.employeeId, input.start, input.end);
  if (weeks.length > 0) {
    warnings.push({
      code: 'OVERBOOKED',
      weeks,
      message: `${employee?.name ?? 'Person'} ist in ${weeks.length} Woche(n) über 100 % ausgelastet: ${weeks.join(', ')}.`,
    });
  }

  return { errors, warnings };
}

export function validateEmployee(input: EmployeeInput): ValidationResult {
  const errors: ValidationIssue[] = [];
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    errors.push({ code: 'REQUIRED', field: 'name', message: 'Name ist erforderlich.' });
  }
  if (typeof input.role !== 'string' || input.role.trim() === '') {
    errors.push({ code: 'REQUIRED', field: 'role', message: 'Rolle ist erforderlich.' });
  }
  if (!SENIORITIES.includes(input.seniority)) {
    errors.push({ code: 'INVALID_VALUE', field: 'seniority', message: `Ungültige Seniorität "${String(input.seniority)}".` });
  }
  if (
    typeof input.capacity !== 'number' ||
    !Number.isFinite(input.capacity) ||
    input.capacity < CAPACITY_MIN ||
    input.capacity > CAPACITY_MAX
  ) {
    errors.push({
      code: 'CAPACITY_RANGE',
      field: 'capacity',
      message: `Kapazität muss zwischen ${CAPACITY_MIN} und ${CAPACITY_MAX} liegen.`,
    });
  }
  if (typeof input.active !== 'boolean') {
    errors.push({ code: 'INVALID_VALUE', field: 'active', message: 'Aktiv-Status muss true oder false sein.' });
  }
  return { errors, warnings: [] };
}

export function validateProject(input: ProjectInput): ValidationResult {
  const errors: ValidationIssue[] = [];
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    errors.push({ code: 'REQUIRED', field: 'name', message: 'Name ist erforderlich.' });
  }
  const warnings: ValidationIssue[] = [];
  if (typeof input.color !== 'string' || input.color.trim() === '') {
    errors.push({ code: 'REQUIRED', field: 'color', message: 'Farbe ist erforderlich.' });
  } else if (!isProjectColor(input.color)) {
    // Non-blocking so legacy data stays editable; the UI only offers palette colours.
    warnings.push({
      code: 'COLOR_NOT_IN_PALETTE',
      field: 'color',
      message: `Farbe "${input.color}" ist nicht in der Projektpalette (${PROJECT_COLORS.join(', ')}) und kann mit Auslastungswarnungen verwechselt werden.`,
    });
  }
  if (!PROJECT_STATUSES.includes(input.status)) {
    errors.push({ code: 'INVALID_VALUE', field: 'status', message: `Ungültiger Status "${String(input.status)}".` });
  }
  validateRange(input.start, input.end, errors);
  return { errors, warnings };
}
