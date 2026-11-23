import type { ComponentProps } from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalRepository } from '../../data/localRepository';
import { createSeed } from '../../data/seed';
import { renderWithProviders } from '../../test/render';
import { computeInsights } from './boardModel';
import { PlanningBoard } from './PlanningBoard';

// Wednesday of ISO week 48 (2026 has 53 ISO weeks). Default range: KW 46 … KW 9 (2027).
const TODAY = '2026-11-25';

function setup(props: Partial<ComponentProps<typeof PlanningBoard>> = {}) {
  const repository = new LocalRepository({ storage: null, today: TODAY });
  const user = userEvent.setup();
  const utils = renderWithProviders(<PlanningBoard today={TODAY} {...props} />, { repository });
  return { user, ...utils };
}

// Plain selectors for the hot helpers: role queries over ~250 cells are slow in jsdom.
const bodyRows = () => [...screen.getByRole('grid').querySelectorAll<HTMLElement>('[role="row"][data-employee-id]')];
const rowNames = () => bodyRows().map((r) => r.querySelector('[role="rowheader"]')?.textContent ?? '');
const weekHeaders = () => [...screen.getByRole('grid').querySelectorAll<HTMLElement>('[role="columnheader"][data-week-key]')];

describe('PlanningBoard', () => {
  it('renders the seeded active people and 17 week columns with the current week highlighted', async () => {
    setup();
    const grid = await screen.findByRole('grid', { name: /Planungsboard/ });
    expect(bodyRows()).toHaveLength(13); // 14 seeded, 1 inactive hidden by default

    const headers = within(grid).getAllByRole('columnheader');
    expect(headers).toHaveLength(18); // "Person" + 17 weeks
    expect(headers[1]).toHaveTextContent('KW 46');
    expect(headers[1]).toHaveTextContent('09.11.');
    expect(headers[17]).toHaveTextContent('KW 9');
    const current = within(grid).getByRole('columnheader', { current: 'date' });
    expect(current).toHaveTextContent('KW 48');
    expect(current).toHaveTextContent('23.11.');

    expect(screen.getByTestId('today-marker')).toBeInTheDocument();
    expect(screen.getByTestId('row-count')).toHaveTextContent('13 von 13 Personen');
  });

  it('shows name, role · seniority and a capacity badge for part-timers', async () => {
    setup();
    await screen.findByRole('grid');
    const sophie = bodyRows().find((r) => r.textContent?.includes('Sophie Weber'))!;
    const header = within(sophie).getByRole('rowheader');
    expect(header).toHaveTextContent('Design · Professional');
    expect(header).toHaveTextContent('80 %');
    const anna = within(bodyRows()[0]).getByRole('rowheader');
    expect(anna).toHaveTextContent('Anna Schmidt');
    expect(anna).not.toHaveTextContent('%');
  });

  it('labels overbooked cells in words and with data attributes', async () => {
    setup();
    await screen.findByRole('grid');
    const cell = screen.getByRole('gridcell', { name: 'Jonas Fischer, KW 48: 120 % ausgelastet, überbucht' });
    expect(cell).toHaveAttribute('data-status', 'over');
    expect(cell).toHaveAttribute('data-week-key', '2026-W48');
    expect(cell).toHaveAttribute('data-employee-id', 'emp-04');
    expect(cell).toHaveTextContent('120'); // strip: mono number + icon, no "%" sign

    // Exactly 100 % is "voll" (neutral), not overbooked and not a warning.
    expect(screen.getByRole('gridcell', { name: /^Lukas Müller, KW 48: 100 % ausgelastet, voll$/ })).toHaveAttribute(
      'data-status',
      'full',
    );
    expect(screen.getAllByRole('gridcell').filter((c) => c.getAttribute('data-status') === 'over')).toHaveLength(2);
  });

  it('renders focusable project bars with a descriptive label and reports selection', async () => {
    const onAssignmentSelect = vi.fn();
    const { user } = setup({ onAssignmentSelect });
    await screen.findByRole('grid');
    const bar = screen.getByRole('button', { name: /^Jonas Fischer: Security-Audit, 50 %, 26\.10\.2026 bis 04\.12\.2026/ });
    expect(bar).toHaveAttribute('data-assignment-id', 'asg-06');
    expect(bar).toHaveAttribute('data-employee-id', 'emp-04');
    expect(bar).toHaveTextContent('Security-Audit');
    expect(bar).toHaveTextContent('50 %');
    await user.click(bar);
    expect(onAssignmentSelect).toHaveBeenCalledWith('asg-06');
  });

  it('filters by name search', async () => {
    const { user } = setup();
    await screen.findByRole('grid');
    await user.type(screen.getByRole('searchbox', { name: 'Person suchen' }), 'jonas');
    expect(rowNames()).toEqual([expect.stringContaining('Jonas Fischer')]);
    expect(screen.getByTestId('row-count')).toHaveTextContent('1 von 13 Personen');
  });

  it('filters by role', async () => {
    const { user } = setup();
    await screen.findByRole('grid');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Rolle filtern' }), 'Backend');
    const names = rowNames();
    expect(names).toHaveLength(3);
    expect(names.join()).toMatch(/Lukas Müller.*Jonas Fischer.*Paul Richter/);
  });

  it('filters by project and dims bars of other projects', async () => {
    const { user } = setup();
    await screen.findByRole('grid');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Projekt filtern' }), 'Security-Audit');
    const names = rowNames();
    expect(names).toHaveLength(3);
    expect(names.join()).toMatch(/Jonas Fischer.*Laura Hoffmann.*Maximilian Schulz/);
    const jonas = bodyRows().find((r) => r.getAttribute('data-employee-id') === 'emp-04')!;
    const security = within(jonas).getByRole('button', { name: /Security-Audit/ });
    const other = within(jonas).getByRole('button', { name: /Datenplattform/ });
    expect(getComputedStyle(security).opacity).toBe('1');
    expect(getComputedStyle(other).opacity).not.toBe('1');
  });

  it('shows only people with free capacity when the toggle is on', async () => {
    const { user } = setup();
    await screen.findByRole('grid');
    const seed = createSeed(TODAY);
    const expected = computeInsights(seed.employees, seed.assignments, TODAY).freeEmployeeIds;
    expect(expected.size).toBeGreaterThan(0);
    expect(expected.size).toBeLessThan(13);

    await user.click(screen.getByRole('checkbox', { name: 'Nur mit freier Kapazität' }));
    const ids = bodyRows().map((r) => r.getAttribute('data-employee-id'));
    expect(new Set(ids)).toEqual(expected);
  });

  it('insight strip counts overbooked person-weeks and applies the matching filter', async () => {
    const { user } = setup();
    await screen.findByRole('grid');
    const over = screen.getByRole('button', { name: /überbuchte Personenwochen/ });
    expect(over).toHaveTextContent('2');
    await user.click(over);
    expect(over).toHaveAttribute('aria-pressed', 'true');
    expect(rowNames()).toEqual([expect.stringContaining('Jonas Fischer')]);

    const free = screen.getByRole('button', { name: /freier Kapazität/ });
    await user.click(free);
    expect(over).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('checkbox', { name: 'Nur mit freier Kapazität' })).toBeChecked();
  });

  it('shows inactive people on demand', async () => {
    const { user } = setup();
    await screen.findByRole('grid');
    expect(screen.queryByText('Niklas Neumann')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Inaktive zeigen' }));
    expect(bodyRows()).toHaveLength(14);
    expect(screen.getByText('Niklas Neumann')).toBeInTheDocument();
  });

  it('shows an empty state with a reset action when no one matches', async () => {
    const { user } = setup();
    await screen.findByRole('grid');
    await user.type(screen.getByRole('searchbox', { name: 'Person suchen' }), 'xyz');
    expect(bodyRows()).toHaveLength(0); // the empty state sits inside the frame, below the header
    const empty = screen.getByTestId('board-empty');
    expect(empty).toHaveTextContent('Keine Personen passen zu den Filtern');
    await user.click(within(empty).getByRole('button', { name: 'Filter zurücksetzen' }));
    expect(bodyRows()).toHaveLength(13);
  });

  it('navigates the range by 4 weeks and back to today', async () => {
    const { user } = setup();
    const grid = await screen.findByRole('grid');
    const firstWeek = () => weekHeaders()[0];
    expect(firstWeek()).toHaveTextContent('KW 46');
    expect(screen.getByRole('button', { name: 'Heute' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '4 Wochen vor' }));
    expect(firstWeek()).toHaveTextContent('KW 50');
    expect(screen.getByTestId('visible-range')).toHaveTextContent('KW 50 – KW 13');
    expect(grid.querySelector('[aria-current="date"]')).toBeNull();
    expect(screen.queryByTestId('today-marker')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '4 Wochen zurück' }));
    await user.click(screen.getByRole('button', { name: '4 Wochen zurück' }));
    expect(firstWeek()).toHaveTextContent('KW 42');

    await user.click(screen.getByRole('button', { name: 'Heute' }));
    expect(firstWeek()).toHaveTextContent('KW 46');
  }, 15_000); // four full re-renders of the grid are slow in jsdom (not in the browser)

  it('changes the column width (zoom)', async () => {
    const { user } = setup();
    await screen.findByRole('grid');
    const header = () => weekHeaders()[0];
    expect(getComputedStyle(header()).width).toBe('88px');
    await user.click(screen.getByRole('button', { name: 'L' }));
    expect(getComputedStyle(header()).width).toBe('128px');
    expect(screen.getByRole('button', { name: 'L' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows an error state with retry when loading fails', async () => {
    const repository = new LocalRepository({ storage: null, today: TODAY });
    repository.listEmployees = () => Promise.reject(new Error('offline'));
    renderWithProviders(<PlanningBoard today={TODAY} />, { repository });
    expect(await screen.findByTestId('board-error')).toHaveTextContent('offline');
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
  });

  it('shows the empty state when there are no people', async () => {
    const repository = new LocalRepository({
      storage: null,
      today: TODAY,
      seed: () => ({ employees: [], projects: [], assignments: [] }),
    });
    renderWithProviders(<PlanningBoard today={TODAY} />, { repository });
    expect(await screen.findByTestId('board-empty')).toHaveTextContent('Noch keine Personen angelegt');
  });
});
