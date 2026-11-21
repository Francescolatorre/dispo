import { createSeed } from '../../data/seed';
import { computeOutlook, DEFAULT_PEOPLE_FILTERS, filterEmployees, roleOptions, STRIP_WEEKS } from './peopleModel';

const TODAY = '2026-11-25'; // KW 48
const seed = createSeed(TODAY);
const names = (list: { name: string }[]) => list.map((e) => e.name);

describe('filterEmployees', () => {
  it('hides inactive people by default and sorts by name', () => {
    const list = filterEmployees(seed.employees, DEFAULT_PEOPLE_FILTERS);
    expect(list).toHaveLength(13);
    expect(names(list)).not.toContain('Niklas Neumann');
    expect(names(list)[0]).toBe('Anna Schmidt');
  });

  it('shows inactive people last when requested', () => {
    const list = filterEmployees(seed.employees, { ...DEFAULT_PEOPLE_FILTERS, showInactive: true });
    expect(list).toHaveLength(14);
    expect(list[13].name).toBe('Niklas Neumann');
  });

  it('filters by role and by name/role search (case-insensitive)', () => {
    expect(names(filterEmployees(seed.employees, { ...DEFAULT_PEOPLE_FILTERS, role: 'QA' }))).toEqual(['Laura Hoffmann', 'Tim Wolf']);
    expect(names(filterEmployees(seed.employees, { ...DEFAULT_PEOPLE_FILTERS, search: 'MÜLLER' }))).toEqual(['Lukas Müller']);
    expect(filterEmployees(seed.employees, { ...DEFAULT_PEOPLE_FILTERS, search: 'design' })).toHaveLength(2);
  });
});

describe('roleOptions', () => {
  it('merges suggested and used roles', () => {
    const roles = roleOptions([...seed.employees, { ...seed.employees[0], id: 'x', role: 'Data Science' }]);
    expect(roles).toContain('Data Science');
    expect(roles).toContain('DevOps');
    expect(new Set(roles).size).toBe(roles.length);
  });
});

describe('computeOutlook', () => {
  const outlook = computeOutlook(seed.employees, seed.assignments, TODAY);
  const byName = (name: string) => outlook[seed.employees.find((e) => e.name === name)!.id];

  it('returns an 8-week strip starting with the current week', () => {
    const strip = byName('Jonas Fischer').strip;
    expect(strip).toHaveLength(STRIP_WEEKS);
    expect(strip[0].weekKey).toBe('2026-W48');
    expect(strip.slice(0, 2).map((l) => l.status)).toEqual(['over', 'over']);
  });

  it('finds the first week with at least 20 % free', () => {
    expect(byName('Lukas Müller').freeFrom).toMatchObject({ weekKey: '2026-W52', freePercent: 40, now: false });
    expect(byName('Jonas Fischer').freeFrom).toMatchObject({ weekKey: '2026-W50', now: false });
    expect(byName('Anna Schmidt').freeFrom).toMatchObject({ weekKey: '2026-W48', freePercent: 20, now: true });
  });
});
