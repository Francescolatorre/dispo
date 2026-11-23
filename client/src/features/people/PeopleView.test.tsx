import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalRepository } from '../../data/localRepository';
import type { Repository } from '../../data/repository';
import { renderWithProviders } from '../../test/render';
import { PeopleView } from './PeopleView';

const TODAY = '2026-11-25'; // KW 48

function setup(repository: Repository = new LocalRepository({ storage: null, today: TODAY })) {
  const user = userEvent.setup();
  const utils = renderWithProviders(<PeopleView today={TODAY} />, { repository, route: '/people' });
  return { user, ...utils };
}

const rows = () => [...screen.getByRole('table', { name: 'Personen' }).querySelectorAll<HTMLElement>('tbody tr')];
const rowOf = (name: string) => rows().find((r) => r.textContent?.includes(name))!;

async function openPerson(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: `${name} bearbeiten` }));
  return screen.findByRole('dialog', { name: 'Person bearbeiten' });
}

describe('PeopleView', () => {
  it('lists active people with role, seniority, capacity, utilization strip and availability', async () => {
    setup();
    await screen.findByRole('table', { name: 'Personen' });
    expect(rows()).toHaveLength(13);
    expect(screen.getByTestId('people-count')).toHaveTextContent('13 von 13 Personen');

    const sophie = rowOf('Sophie Weber');
    expect(sophie).toHaveTextContent('Design · Professional');
    expect(sophie).toHaveTextContent('80 %');

    const lukas = rowOf('Lukas Müller');
    expect(lukas).toHaveTextContent('Backend · Lead');
    expect(lukas).toHaveTextContent('frei ab KW 52');
    const strip = within(lukas).getByRole('img', { name: /^Lukas Müller, Auslastung: KW 48 100 %/ });
    expect(strip.querySelectorAll('[data-status]')).toHaveLength(8);

    const jonas = within(rowOf('Jonas Fischer')).getByTestId('utilization-strip');
    expect([...jonas.querySelectorAll('[data-status]')].slice(0, 2).map((b) => b.getAttribute('data-status'))).toEqual(['over', 'over']);
    expect(rowOf('Anna Schmidt')).toHaveTextContent('frei ab sofort');
    expect(within(rowOf('Anna Schmidt')).getByRole('link', { name: 'Anna Schmidt im Board zeigen' })).toHaveAttribute(
      'href',
      '/?q=Anna%20Schmidt',
    );
  });

  it('filters by search, role and inactive toggle', async () => {
    const { user } = setup();
    await screen.findByRole('table', { name: 'Personen' });

    await user.type(screen.getByRole('searchbox', { name: 'Person suchen' }), 'sch');
    expect(rows().map((r) => r.querySelector('button')?.textContent)).toEqual(['Anna Schmidt', 'Jonas Fischer', 'Julia Schröder', 'Maximilian Schulz']);
    await user.click(screen.getAllByRole('button', { name: 'Filter zurücksetzen' })[0]);
    expect(rows()).toHaveLength(13);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rolle filtern' }), 'QA');
    expect(rows()).toHaveLength(2);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Rolle filtern' }), '');

    await user.click(screen.getByRole('checkbox', { name: 'Inaktive zeigen' }));
    expect(rows()).toHaveLength(14);
    expect(rowOf('Niklas Neumann')).toHaveTextContent('inaktiv');
  });

  it('shows an empty state for a filter without hits', async () => {
    const { user } = setup();
    await screen.findByRole('table', { name: 'Personen' });
    await user.type(screen.getByRole('searchbox', { name: 'Person suchen' }), 'zzz');
    expect(screen.getByText('Keine Personen gefunden')).toBeInTheDocument();
  });

  it('creates a person through the drawer (name focused, free-text role)', async () => {
    const { user } = setup();
    await screen.findByRole('table', { name: 'Personen' });
    await user.click(screen.getByRole('button', { name: 'Person anlegen' }));
    const drawer = await screen.findByRole('dialog', { name: 'Neue Person' });
    const name = within(drawer).getByRole('textbox', { name: /Name/ });
    await waitFor(() => expect(name).toHaveFocus());

    // Blocking errors appear only after a save attempt.
    await user.click(within(drawer).getByRole('button', { name: 'Anlegen' }));
    expect(await within(drawer).findByText('Name ist erforderlich.')).toBeInTheDocument();

    await user.type(name, 'Mia Lange');
    await user.type(within(drawer).getByRole('combobox', { name: /Rolle/ }), 'Data Science');
    await user.selectOptions(within(drawer).getByRole('combobox', { name: 'Seniorität' }), 'senior');
    within(drawer).getByRole('slider', { name: 'Kapazität' }).focus();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(within(drawer).getByTestId('capacity-value')).toHaveTextContent('80 %');
    await user.click(within(drawer).getByRole('button', { name: 'Anlegen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const mia = rowOf('Mia Lange');
    expect(mia).toHaveTextContent('Data Science · Senior');
    expect(mia).toHaveTextContent('80 %');
    expect(mia).toHaveTextContent('frei ab sofort');
  });

  it('shows live dry-run warnings when lowering capacity, and saves the change', async () => {
    const { user, repository } = setup();
    await screen.findByRole('table', { name: 'Personen' });
    const drawer = await openPerson(user, 'Lukas Müller');
    expect(within(drawer).getByText('2 Einsätze im Plan')).toBeInTheDocument();
    expect(within(drawer).queryByTestId('dry-run-warning')).not.toBeInTheDocument();

    within(drawer).getByRole('slider', { name: 'Kapazität' }).focus();
    await user.keyboard('{ArrowLeft}');
    const warning = await within(drawer).findByTestId('dry-run-warning');
    expect(warning).toHaveTextContent('Überbucht in KW 48, KW 49, KW 50, KW 51');

    await user.click(within(drawer).getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((await repository.listEmployees()).find((e) => e.name === 'Lukas Müller')?.capacity).toBe(0.9);
    expect(rowOf('Lukas Müller')).toHaveTextContent('90 %');
  });

  it('Esc closes the drawer without saving', async () => {
    const { user, repository } = setup();
    await screen.findByRole('table', { name: 'Personen' });
    const drawer = await openPerson(user, 'Anna Schmidt');
    await user.clear(within(drawer).getByRole('textbox', { name: /Name/ }));
    await user.type(within(drawer).getByRole('textbox', { name: /Name/ }), 'Anna X');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((await repository.listEmployees()).some((e) => e.name === 'Anna X')).toBe(false);
  });

  it('deletes a person (with cascade notice) and restores it via the undo toast', async () => {
    const { user, repository } = setup();
    await screen.findByRole('table', { name: 'Personen' });
    const drawer = await openPerson(user, 'Jonas Fischer');
    await user.click(within(drawer).getByRole('button', { name: 'Löschen' }));
    const confirm = within(drawer).getByRole('alertdialog', { name: 'Jonas Fischer löschen?' });
    expect(confirm).toHaveTextContent('3 Einsätze werden ebenfalls entfernt');
    expect(within(confirm).getByRole('button', { name: 'Abbrechen' })).toHaveFocus();
    await user.click(within(confirm).getByRole('button', { name: 'Endgültig löschen' }));

    const toast = await screen.findByTestId('undo-toast');
    expect(toast).toHaveTextContent('Person gelöscht');
    expect(toast).toHaveTextContent('Jonas Fischer · 3 Einsätze entfernt');
    await waitFor(() => expect(rows().some((r) => r.textContent?.includes('Jonas Fischer'))).toBe(false));
    expect(await repository.listAssignments()).toHaveLength(27);

    await user.click(within(toast).getByRole('button', { name: 'Rückgängig' }));
    await waitFor(() => expect(rows().some((r) => r.textContent?.includes('Jonas Fischer'))).toBe(true));
    expect(await repository.listAssignments()).toHaveLength(30);
  });

  it('shows an empty state without people', async () => {
    const empty = new LocalRepository({ storage: null, seed: () => ({ employees: [], projects: [], assignments: [] }) });
    setup(empty);
    expect(await screen.findByText('Noch keine Personen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Person anlegen' })).toBeInTheDocument();
  });

  it('shows a load error with retry', async () => {
    const failing = new LocalRepository({ storage: null, today: TODAY });
    vi.spyOn(failing, 'listEmployees').mockRejectedValueOnce(new Error('offline'));
    const { user } = setup(failing);
    expect(await screen.findByTestId('list-error')).toHaveTextContent('offline');
    await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(await screen.findByRole('table', { name: 'Personen' })).toBeInTheDocument();
  });
});
