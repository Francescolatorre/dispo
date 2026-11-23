/**
 * Deterministic demo data relative to the week of `today`.
 *
 * Week offsets below are relative to the current ISO week (0 = this week). Assignments run
 * Monday of the first week to Friday of the last week unless noted otherwise.
 *
 * Built-in story (asserted in seed.test.ts):
 * - Jonas Fischer is overbooked (120 %) in weeks 0 and +1 — the only two "over" cells.
 * - Lukas Müller sits at exactly 100 % ("voll", not over) from week 0 to +3.
 * - Felix Becker and Paul Richter are free next month (weeks +4/+5).
 * - Security-Audit ends at the end of next week.
 * - Three part-timers (0.5 / 0.6 / 0.8), one inactive person.
 */
import { addDays, addWeeks, startOfISOWeek } from '../domain/dates';
import type { Assignment, Employee, ISODate, PlanningData, Project } from '../domain/types';

type EmployeeSeed = Omit<Employee, 'id'>;

const EMPLOYEES: EmployeeSeed[] = [
  { name: 'Anna Schmidt', role: 'Frontend', seniority: 'senior', capacity: 1, active: true },
  { name: 'Lukas Müller', role: 'Backend', seniority: 'lead', capacity: 1, active: true },
  { name: 'Sophie Weber', role: 'Design', seniority: 'mid', capacity: 0.8, active: true },
  { name: 'Jonas Fischer', role: 'Backend', seniority: 'mid', capacity: 1, active: true },
  { name: 'Marie Wagner', role: 'PM', seniority: 'senior', capacity: 1, active: true },
  { name: 'Felix Becker', role: 'Frontend', seniority: 'junior', capacity: 1, active: true },
  { name: 'Laura Hoffmann', role: 'QA', seniority: 'mid', capacity: 0.5, active: true },
  { name: 'Maximilian Schulz', role: 'DevOps', seniority: 'senior', capacity: 1, active: true },
  { name: 'Lea Koch', role: 'Frontend', seniority: 'mid', capacity: 1, active: true },
  { name: 'Paul Richter', role: 'Backend', seniority: 'junior', capacity: 1, active: true },
  { name: 'Hannah Klein', role: 'Design', seniority: 'senior', capacity: 0.6, active: true },
  { name: 'Tim Wolf', role: 'QA', seniority: 'senior', capacity: 1, active: true },
  { name: 'Julia Schröder', role: 'PM', seniority: 'lead', capacity: 1, active: true },
  { name: 'Niklas Neumann', role: 'Backend', seniority: 'senior', capacity: 1, active: false },
];

/** [name, color, startWeek, endWeek, status] */
const PROJECTS: Array<[string, string, number, number, Project['status']]> = [
  ['Website-Relaunch', 'cobalt', -4, 6, 'active'],
  ['Mobile App 2.0', 'violet', -2, 14, 'active'],
  ['Security-Audit', 'slate', -4, 1, 'active'],
  ['Datenplattform', 'cyan', -2, 16, 'active'],
  ['CRM-Migration', 'indigo', 2, 12, 'planned'],
  ['KI-Assistent', 'fuchsia', 4, 16, 'planned'],
  ['Onboarding-Portal', 'sky', -4, 3, 'active'],
];

/** [employee #, project #, startWeek, endWeek, allocation, endDayOffset?] (1-based indices) */
const ASSIGNMENTS: Array<[number, number, number, number, number, number?]> = [
  [1, 1, -4, 6, 80], // Anna: Website-Relaunch
  [2, 4, 0, 16, 60], // Lukas: Datenplattform
  [2, 2, -2, 3, 40], // Lukas: Mobile App → exactly 100 % in weeks 0..+3
  [3, 1, -4, 6, 30], // Sophie (0.8)
  [3, 2, -2, 10, 40], // Sophie (0.8) → 87.5 %
  [4, 3, -4, 1, 50], // Jonas: Security-Audit
  [4, 4, -2, 12, 40], // Jonas: Datenplattform
  [4, 2, 0, 1, 30], // Jonas: release support → 120 % in weeks 0 and +1
  [5, 1, -4, 6, 30], // Marie
  [5, 2, -2, 14, 30],
  [5, 5, 2, 12, 30],
  [6, 1, -4, 3, 50, 2], // Felix: ends Wednesday of week +3, free from +4
  [7, 3, -4, 1, 30], // Laura (0.5) → 60 %
  [7, 2, 2, 14, 20],
  [8, 4, 0, 16, 40], // Maximilian
  [8, 3, -4, 1, 20],
  [8, 6, 4, 16, 30],
  [9, 2, -2, 14, 70], // Lea
  [9, 7, -4, 3, 20],
  [10, 7, -4, 3, 60], // Paul: free in weeks +4/+5
  [10, 5, 6, 12, 50],
  [11, 6, 4, 16, 30], // Hannah (0.6)
  [11, 7, -4, 3, 30],
  [11, 5, 2, 6, 20],
  [12, 1, -4, 6, 40], // Tim
  [12, 5, 2, 12, 40],
  [13, 4, 0, 16, 40], // Julia
  [13, 6, 4, 16, 40],
  [13, 7, -4, 3, 20],
  [14, 3, -4, -2, 50], // Niklas (inactive), historic
];

const id = (prefix: string, n: number) => `${prefix}-${String(n).padStart(2, '0')}`;

export function createSeed(today: ISODate): PlanningData {
  const week0 = startOfISOWeek(today);
  const monday = (w: number) => addWeeks(week0, w);
  const friday = (w: number) => addDays(monday(w), 4);

  const employees: Employee[] = EMPLOYEES.map((e, i) => ({ id: id('emp', i + 1), ...e }));

  const projects: Project[] = PROJECTS.map(([name, color, from, to, status], i) => ({
    id: id('prj', i + 1),
    name,
    color,
    start: monday(from),
    end: friday(to),
    status,
  }));

  const assignments: Assignment[] = ASSIGNMENTS.map(([emp, prj, from, to, allocation, endDay], i) => ({
    id: id('asg', i + 1),
    employeeId: id('emp', emp),
    projectId: id('prj', prj),
    start: monday(from),
    end: endDay === undefined ? friday(to) : addDays(monday(to), endDay),
    allocation,
  }));

  return { employees, projects, assignments };
}
