/**
 * Core domain types of the planning MVP.
 *
 * Everything here is plain JSON (string ids, `YYYY-MM-DD` date strings) so the same
 * shapes travel unchanged between the UI, the repository (local or HTTP) and WebMCP tools.
 */

/** Calendar date as `YYYY-MM-DD` (local calendar day, no time, no timezone). */
export type ISODate = string;

/** ISO week key, e.g. `2026-W48`. */
export type WeekKey = string;

export const SENIORITIES = ['junior', 'mid', 'senior', 'lead'] as const;
export type Seniority = (typeof SENIORITIES)[number];

export const PROJECT_STATUSES = ['planned', 'active', 'done'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Suggested roles; `role` stays a free string so new roles need no code change. */
export const ROLES = ['Frontend', 'Backend', 'Design', 'PM', 'QA', 'DevOps'] as const;

export interface Employee {
  id: string;
  name: string;
  role: string;
  seniority: Seniority;
  /** Part-time factor 0.1–1.0 (1.0 = full time). */
  capacity: number;
  active: boolean;
}

export interface Project {
  id: string;
  name: string;
  /** Chakra color scheme name, e.g. `blue`, `teal`. */
  color: string;
  start: ISODate;
  end: ISODate;
  status: ProjectStatus;
}

export interface Assignment {
  id: string;
  employeeId: string;
  projectId: string;
  /** Inclusive. */
  start: ISODate;
  /** Inclusive. */
  end: ISODate;
  /** Percent of a full-time week, 10–100 in steps of 10. */
  allocation: number;
  role?: string;
}

export type EmployeeInput = Omit<Employee, 'id'>;
export type EmployeeUpdate = Partial<EmployeeInput>;

export type ProjectInput = Omit<Project, 'id'>;
export type ProjectUpdate = Partial<ProjectInput>;

export type AssignmentInput = Omit<Assignment, 'id'>;
/** Patch semantics: omitted/undefined = unchanged; `role: null` clears the role. */
export type AssignmentUpdate = Partial<Omit<AssignmentInput, 'role'>> & { role?: string | null };

/** A complete data snapshot (what the seed produces and what actions validate against). */
export interface PlanningData {
  employees: Employee[];
  projects: Project[];
  assignments: Assignment[];
}
