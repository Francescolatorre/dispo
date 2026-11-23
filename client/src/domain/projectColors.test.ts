import { LocalRepository } from '../data/localRepository';
import { createSeed } from '../data/seed';
import theme from '../theme';
import { createPlanningActions, snapshotFromRepository } from './planningActions';
import { isProjectColor, PROJECT_COLORS, projectColor, projectColorTokens, suggestProjectColor } from './projectColors';
import { validateProject } from './validation';

const base = { name: 'P', start: '2026-01-05', end: '2026-02-27', status: 'planned' as const };

describe('PROJECT_COLORS', () => {
  it('has the 8 hues of the design palette', () => {
    expect(PROJECT_COLORS).toEqual(['sky', 'cobalt', 'indigo', 'violet', 'grape', 'fuchsia', 'cyan', 'slate']);
  });

  it('never contains workload signal colours (red, orange, yellow, green) or look-alikes', () => {
    for (const forbidden of ['red', 'orange', 'yellow', 'green', 'teal', 'pink']) {
      expect(PROJECT_COLORS).not.toContain(forbidden);
      expect(isProjectColor(forbidden)).toBe(false);
    }
  });

  it('only contains colours with a full scale in the theme (bars use .100–.900)', () => {
    const colors = theme.colors as Record<string, Record<string, string>>;
    for (const c of PROJECT_COLORS) {
      for (const shade of ['100', '200', '300', '400', '500', '600', '900']) expect(colors[c]?.[shade]).toBeTruthy();
    }
  });

  it('suggests the first unused colour and cycles when all are taken', () => {
    expect(suggestProjectColor([])).toBe('sky');
    expect(suggestProjectColor(['sky', 'cobalt'])).toBe('indigo');
    expect(isProjectColor(suggestProjectColor([...PROJECT_COLORS]))).toBe(true);
  });

  it('is used by every seeded project, with distinct colours', () => {
    const seed = createSeed('2026-11-25');
    expect(seed.projects.every((p) => isProjectColor(p.color))).toBe(true);
    expect(new Set(seed.projects.map((p) => p.color)).size).toBe(seed.projects.length);
  });
});

describe('projectColor', () => {
  it('maps legacy Chakra colour names onto the palette', () => {
    expect(projectColor('cobalt')).toBe('cobalt');
    expect(projectColor('blue')).toBe('cobalt');
    expect(projectColor('red')).toBe('indigo');
    expect(projectColor('orange')).toBe('slate');
    expect(projectColor('green')).toBe('cyan');
    expect(projectColor('unknown')).toBe('slate');
    expect(projectColor(undefined)).toBe('slate');
  });

  it('returns edge / tint / text tokens', () => {
    const violet = { edge: 'violet.600', tint: 'violet.100', fg: 'violet.800', wash: 'violet.50', line: 'violet.200' };
    expect(projectColorTokens('violet')).toEqual(violet);
    expect(projectColorTokens('purple')).toEqual(violet);
    expect(projectColorTokens('slate')).toMatchObject({ tint: 'slate.200', wash: 'slate.100', line: 'slate.300' });
  });
});

describe('palette enforcement', () => {
  it('validateProject warns (non-blocking) on colours outside the palette', () => {
    expect(validateProject({ ...base, color: 'cyan' })).toEqual({ errors: [], warnings: [] });
    const result = validateProject({ ...base, color: 'red' });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([expect.objectContaining({ code: 'COLOR_NOT_IN_PALETTE', field: 'color' })]);
  });

  it('createProject and updateProject surface the palette warning', async () => {
    const repo = new LocalRepository({ storage: null, today: '2026-11-25' });
    const actions = createPlanningActions(repo, () => snapshotFromRepository(repo));
    const created = await actions.createProject({ ...base, color: 'orange' }, { dryRun: true });
    expect(created.ok && created.warnings.map((w) => w.code)).toEqual(['COLOR_NOT_IN_PALETTE']);
    const updated = await actions.updateProject('prj-01', { color: 'green' }, { dryRun: true });
    expect(updated.ok && updated.warnings.map((w) => w.code)).toEqual(['COLOR_NOT_IN_PALETTE']);
    const fine = await actions.updateProject('prj-01', { color: 'indigo' }, { dryRun: true });
    expect(fine.ok && fine.warnings).toEqual([]);
  });
});
