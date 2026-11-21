import { createSeed } from '../../data/seed';
import { computeProjectStats, DEFAULT_PROJECT_FILTERS, filterProjects, timelinePosition, timelineWindow } from './projectsModel';

const TODAY = '2026-11-25'; // KW 48
const seed = createSeed(TODAY);

describe('filterProjects', () => {
  it('sorts active before planned, then by start', () => {
    const list = filterProjects(seed.projects, DEFAULT_PROJECT_FILTERS);
    expect(list).toHaveLength(7);
    expect(list.slice(-2).map((p) => p.status)).toEqual(['planned', 'planned']);
  });

  it('filters by status and name', () => {
    expect(filterProjects(seed.projects, { search: '', status: 'planned' }).map((p) => p.name)).toEqual(['CRM-Migration', 'KI-Assistent']);
    expect(filterProjects(seed.projects, { search: 'audit', status: '' }).map((p) => p.name)).toEqual(['Security-Audit']);
  });
});

describe('computeProjectStats', () => {
  it('counts distinct people and staffed FTE in the current week', () => {
    const stats = computeProjectStats(seed.projects, seed.assignments, TODAY);
    // Website-Relaunch: Anna 80 + Sophie 30 + Marie 30 + Felix 50 + Tim 40.
    expect(stats['prj-01']).toEqual({ people: 5, assignments: 5, currentFte: 2.3 });
    // CRM-Migration starts in two weeks.
    expect(stats['prj-05'].currentFte).toBe(0);
    expect(stats['prj-05'].people).toBe(4);
  });
});

describe('timeline', () => {
  it('spans all projects and positions bars in percent', () => {
    const w = timelineWindow(seed.projects, TODAY);
    expect(w.from).toBe(seed.projects[0].start);
    const full = timelinePosition(w, w.from, w.to);
    expect(full).toEqual({ left: 0, width: 100 });
    const half = timelinePosition({ from: '2026-01-01', to: '2026-01-10' }, '2026-01-06', '2026-01-10');
    expect(half).toEqual({ left: 50, width: 50 });
  });
});
