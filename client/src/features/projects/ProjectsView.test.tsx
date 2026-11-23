import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalRepository } from '../../data/localRepository';
import type { Repository } from '../../data/repository';
import { PROJECT_COLORS } from '../../domain/projectColors';
import { renderWithProviders } from '../../test/render';
import { ProjectsView } from './ProjectsView';

const TODAY = '2026-11-25'; // KW 48, Monday 2026-11-23

function setup(repository: Repository = new LocalRepository({ storage: null, today: TODAY })) {
  const user = userEvent.setup();
  const utils = renderWithProviders(<ProjectsView today={TODAY} />, { repository, route: '/projects' });
  return { user, ...utils };
}

const rows = () => [...screen.getByRole('table', { name: 'Projekte' }).querySelectorAll<HTMLElement>('tbody tr')];
const rowOf = (name: string) => rows().find((r) => r.textContent?.includes(name))!;
const hasRow = (name: string) => rows().some((r) => r.textContent?.includes(name));

async function openProject(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: `${name} bearbeiten` }));
  return screen.findByRole('dialog', { name: 'Projekt bearbeiten' });
}

describe('ProjectsView', () => {
  it('lists projects with colour, status, date range, people, current FTE and timeline', async () => {
    setup();
    await screen.findByRole('table', { name: 'Projekte' });
    expect(rows()).toHaveLength(7);
    expect(screen.getByTestId('projects-count')).toHaveTextContent('7 von 7 Projekten');

    const web = rowOf('Website-Relaunch');
    expect(within(web).getByTestId('color-dot')).toHaveAttribute('data-color', 'cobalt');
    expect(web).toHaveTextContent('Aktiv');
    expect(web).toHaveTextContent('26.10.2026 – 08.01.2027');
    const cells = within(web).getAllByRole('cell');
    expect(cells[4]).toHaveTextContent('5');
    expect(within(web).getByTestId('current-fte')).toHaveTextContent('2,3');
    expect(within(web).getByTestId('timeline-bar')).toBeInTheDocument();
    expect(within(web).getByRole('link', { name: 'Website-Relaunch im Board zeigen' })).toHaveAttribute('href', '/?project=prj-01');

    const crm = rowOf('CRM-Migration');
    expect(crm).toHaveTextContent('Geplant');
    expect(within(crm).getByTestId('current-fte')).toHaveTextContent('0,0');
    // Every seeded project uses a palette colour.
    for (const dot of screen.getAllByTestId('color-dot')) {
      expect(PROJECT_COLORS).toContain(dot.getAttribute('data-color'));
    }
  });

  it('filters by status and search', async () => {
    const { user } = setup();
    await screen.findByRole('table', { name: 'Projekte' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status filtern' }), 'planned');
    expect(rows()).toHaveLength(2);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status filtern' }), '');
    await user.type(screen.getByRole('searchbox', { name: 'Projekt suchen' }), 'daten');
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent('Datenplattform');
  });

  it('offers only palette colours and creates a project', async () => {
    const { user, repository } = setup();
    await screen.findByRole('table', { name: 'Projekte' });
    await user.click(screen.getByRole('button', { name: 'Projekt anlegen' }));
    const drawer = await screen.findByRole('dialog', { name: 'Neues Projekt' });
    await waitFor(() => expect(within(drawer).getByRole('textbox', { name: /Name/ })).toHaveFocus());

    const group = within(drawer).getByRole('radiogroup', { name: 'Farbe' });
    const swatches = within(group).getAllByRole('radio');
    expect(swatches).toHaveLength(PROJECT_COLORS.length);
    expect(within(group).queryByRole('radio', { name: /Rot|Orange|Gelb|Grün/ })).not.toBeInTheDocument();

    await user.type(within(drawer).getByRole('textbox', { name: /Name/ }), 'Intranet');
    await user.click(within(group).getByRole('radio', { name: 'Traube' }));
    fireEvent.change(within(drawer).getByLabelText(/Start/), { target: { value: '2027-01-04' } });
    fireEvent.change(within(drawer).getByLabelText(/Ende/), { target: { value: '2027-03-26' } });
    await user.click(within(drawer).getByRole('button', { name: 'Anlegen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const created = (await repository.listProjects()).find((p) => p.name === 'Intranet');
    expect(created).toMatchObject({ color: 'grape', start: '2027-01-04', end: '2027-03-26', status: 'planned' });
    expect(rowOf('Intranet')).toHaveTextContent('04.01.2027 – 26.03.2027');
  });

  it('blocks an end date before the start date', async () => {
    const { user } = setup();
    await screen.findByRole('table', { name: 'Projekte' });
    const drawer = await openProject(user, 'KI-Assistent');
    fireEvent.change(within(drawer).getByLabelText(/Ende/), { target: { value: '2020-01-01' } });
    await user.click(within(drawer).getByRole('button', { name: 'Speichern' }));
    expect(await within(drawer).findByText('Enddatum liegt vor dem Startdatum.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('warns live when assignments would fall outside the new date range, then saves', async () => {
    const { user, repository } = setup();
    await screen.findByRole('table', { name: 'Projekte' });
    const drawer = await openProject(user, 'Security-Audit');
    expect(within(drawer).getByText('4 Personen · 4 Einsätze')).toBeInTheDocument();
    fireEvent.change(within(drawer).getByLabelText(/Ende/), { target: { value: '2026-11-27' } });
    expect(await within(drawer).findByTestId('dry-run-warning')).toHaveTextContent(
      '3 Einsatz/Einsätze liegen außerhalb der Projektlaufzeit von Security-Audit',
    );
    await user.selectOptions(within(drawer).getByRole('combobox', { name: 'Status' }), 'done');
    await user.click(within(drawer).getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((await repository.listProjects()).find((p) => p.name === 'Security-Audit')).toMatchObject({
      end: '2026-11-27',
      status: 'done',
    });
    expect(rowOf('Security-Audit')).toHaveTextContent('Abgeschlossen');
  });

  it('flags a legacy colour outside the palette', async () => {
    const repo = new LocalRepository({ storage: null, today: TODAY });
    await repo.updateProject('prj-01', { color: 'red' });
    const { user } = setup(repo);
    await screen.findByRole('table', { name: 'Projekte' });
    const drawer = await openProject(user, 'Website-Relaunch');
    expect(within(drawer).getByText(/bisherige Farbe „red“ ist nicht mehr erlaubt/)).toBeInTheDocument();
    expect(within(drawer).queryByRole('radio', { checked: true })).not.toBeInTheDocument();
  });

  it('deletes a project (with cascade notice) and restores it via undo', async () => {
    const { user, repository } = setup();
    await screen.findByRole('table', { name: 'Projekte' });
    const drawer = await openProject(user, 'KI-Assistent');
    await user.click(within(drawer).getByRole('button', { name: 'Löschen' }));
    const confirm = within(drawer).getByRole('alertdialog', { name: 'KI-Assistent löschen?' });
    expect(confirm).toHaveTextContent('3 Einsätze von 3 Personen werden ebenfalls entfernt');
    await user.click(within(confirm).getByRole('button', { name: 'Endgültig löschen' }));

    const toast = await screen.findByTestId('undo-toast');
    expect(toast).toHaveTextContent('Projekt gelöscht');
    await waitFor(() => expect(hasRow('KI-Assistent')).toBe(false));
    expect(await repository.listAssignments()).toHaveLength(27);

    await user.click(within(toast).getByRole('button', { name: 'Rückgängig' }));
    await waitFor(() => expect(hasRow('KI-Assistent')).toBe(true));
    expect(await repository.listAssignments()).toHaveLength(30);
  });

  it('shows an empty state without projects', async () => {
    setup(new LocalRepository({ storage: null, seed: () => ({ employees: [], projects: [], assignments: [] }) }));
    expect(await screen.findByText('Noch keine Projekte')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Projekt anlegen' })).toBeInTheDocument();
  });
});
