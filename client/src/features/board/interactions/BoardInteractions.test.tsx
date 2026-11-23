import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalRepository } from '../../../data/localRepository';
import { renderWithProviders } from '../../../test/render';
import { PlanningBoard } from '../PlanningBoard';

// Wednesday of KW 48. Visible range starts Monday 2026-11-09 (KW 46), columns are 88 px (zoom M).
const TODAY = '2026-11-25';
const COL = 88;
// Seed "asg-08": Jonas Fischer (emp-04), Mobile App 2.0, 30 %, KW 48–49 → x 176 … 352.
const JONAS_RELEASE = 'asg-08';

// jsdom has no PointerEvent: a MouseEvent with the pointer fields is enough for React and the hook.
beforeAll(() => {
  if (typeof window.PointerEvent === 'function') return;
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  Object.defineProperty(window, 'PointerEvent', { value: PointerEventPolyfill, configurable: true, writable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function setup() {
  const repository = new LocalRepository({ storage: null, today: TODAY });
  const user = userEvent.setup();
  renderWithProviders(<PlanningBoard today={TODAY} />, { repository });
  const get = async (id: string) => (await repository.listAssignments()).find((a) => a.id === id);
  return { repository, user, get };
}

const bar = (id: string) => document.querySelector<HTMLElement>(`[data-assignment-id="${id}"]`)!;
const cell = (employeeId: string, weekKey: string) =>
  document.querySelector<HTMLElement>(`[role="gridcell"][data-employee-id="${employeeId}"][data-week-key="${weekKey}"]`)!;

type Point = { x: number; y?: number };
const down = (el: Element, p: Point) => fireEvent.pointerDown(el, { clientX: p.x, clientY: p.y ?? 10, pointerId: 1, button: 0 });
const move = (el: Element, p: Point) => fireEvent.pointerMove(el, { clientX: p.x, clientY: p.y ?? 10, pointerId: 1 });
const up = (el: Element, p: Point) => fireEvent.pointerUp(el, { clientX: p.x, clientY: p.y ?? 10, pointerId: 1, button: 0 });

function drag(el: Element, from: Point, to: Point) {
  down(el, from);
  move(el, { x: (from.x + to.x) / 2, y: ((from.y ?? 10) + (to.y ?? 10)) / 2 });
  move(el, to);
  up(el, to);
}

/** Lays the body rows out vertically (60 px each) so the hook can find the row under the pointer. */
function mockRowRects() {
  const ids = [...document.querySelectorAll('[role="row"][data-employee-id]')].map((r) => r.getAttribute('data-employee-id'));
  const original = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const index = this.getAttribute('role') === 'row' ? ids.indexOf(this.getAttribute('data-employee-id')) : -1;
    if (index < 0) return original.call(this);
    const top = index * 60;
    return { x: 0, y: top, top, left: 0, right: 2000, bottom: top + 60, width: 2000, height: 60, toJSON: () => ({}) } as DOMRect;
  });
  return (employeeId: string) => ids.indexOf(employeeId) * 60 + 30;
}

describe('board interactions', () => {
  it('drags a bar one week to the right with a live preview, then applies it with undo', async () => {
    const { get } = setup();
    await screen.findByRole('grid');
    const el = bar(JONAS_RELEASE);

    down(el, { x: 250 });
    move(el, { x: 300 });
    move(el, { x: 250 + COL + 10 });
    const ghost = await screen.findByTestId('drag-ghost', {}, { timeout: 5000 });
    expect(ghost).toHaveTextContent('Mobile App 2.0 · 30 %');
    const hint = await screen.findByTestId('drag-hint', {}, { timeout: 5000 });
    expect(hint).toHaveTextContent('KW 49–KW 50 · Jonas Fischer · 120 % in KW 49');
    expect(hint).toHaveAttribute('data-over', 'true');
    // Projected utilization in the heat cells: KW 48 drops from 120 % to 90 %, KW 50 rises to 70 %.
    await waitFor(() => expect(cell('emp-04', '2026-W48')).toHaveAttribute('data-projected', 'true'));
    expect(cell('emp-04', '2026-W48')).toHaveAttribute('aria-label', expect.stringContaining('90 % ausgelastet'));
    expect(cell('emp-04', '2026-W48')).toHaveTextContent('120→90'); // before → after in the strip
    expect(cell('emp-04', '2026-W50')).toHaveAttribute('aria-label', expect.stringContaining('70 % ausgelastet'));
    expect(await get(JONAS_RELEASE)).toMatchObject({ start: '2026-11-23', end: '2026-12-04' }); // nothing written yet

    up(el, { x: 250 + COL + 10 });
    const toast = await screen.findByTestId('action-toast');
    expect(toast).toHaveTextContent('Einsatz verschoben');
    expect(toast).toHaveTextContent('KW 49: Jonas Fischer 120 % – überbucht');
    expect(await get(JONAS_RELEASE)).toMatchObject({ employeeId: 'emp-04', start: '2026-11-30', end: '2026-12-11' });
    expect(screen.queryByTestId('drag-ghost')).not.toBeInTheDocument();

    fireEvent.click(within(toast).getByRole('button', { name: 'Rückgängig' }));
    await waitFor(async () => expect(await get(JONAS_RELEASE)).toMatchObject({ start: '2026-11-23', end: '2026-12-04' }));
  }, 20_000);

  it('Esc cancels a running drag without writing', async () => {
    const { get } = setup();
    await screen.findByRole('grid');
    const el = bar(JONAS_RELEASE);
    down(el, { x: 250 });
    move(el, { x: 250 + 2 * COL });
    await screen.findByTestId('drag-ghost', {}, { timeout: 5000 });
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('drag-ghost')).not.toBeInTheDocument());
    expect(screen.queryByTestId('drag-hint')).not.toBeInTheDocument();
    up(el, { x: 250 + 2 * COL });
    expect(await get(JONAS_RELEASE)).toMatchObject({ start: '2026-11-23', end: '2026-12-04' });
    expect(screen.queryByTestId('action-toast')).not.toBeInTheDocument();
  }, 20_000);

  it('a press without movement stays a click and opens the edit drawer', async () => {
    const { get } = setup();
    await screen.findByRole('grid');
    const el = bar(JONAS_RELEASE);
    down(el, { x: 250 });
    move(el, { x: 252 });
    up(el, { x: 252 });
    fireEvent.click(el);
    expect(await screen.findByRole('dialog', { name: 'Einsatz bearbeiten' })).toBeInTheDocument();
    expect(await get(JONAS_RELEASE)).toMatchObject({ start: '2026-11-23' });
  }, 20_000);

  it('resizes the end and the start of a bar, snapped to whole weeks', async () => {
    const { get } = setup();
    await screen.findByRole('grid');
    const endHandle = bar(JONAS_RELEASE).querySelector('[data-resize-handle="end"]')!;
    drag(endHandle, { x: 352 }, { x: 352 + COL + 20 });
    expect(await screen.findByText('Einsatz geändert')).toBeInTheDocument();
    expect(await get(JONAS_RELEASE)).toMatchObject({ start: '2026-11-23', end: '2026-12-11' });

    const startHandle = bar(JONAS_RELEASE).querySelector('[data-resize-handle="start"]')!;
    drag(startHandle, { x: 176 }, { x: 176 - COL });
    await waitFor(async () => expect(await get(JONAS_RELEASE)).toMatchObject({ start: '2026-11-16', end: '2026-12-11' }));
  }, 20_000);

  it('dragging a bar onto another row reassigns it to that person', async () => {
    const { get } = setup();
    await screen.findByRole('grid');
    const rowY = mockRowRects();
    const el = bar(JONAS_RELEASE);
    drag(el, { x: 250, y: rowY('emp-04') }, { x: 250, y: rowY('emp-02') });
    const toast = await screen.findByTestId('action-toast');
    expect(toast).toHaveTextContent('Einsatz verschoben');
    // Lukas is at exactly 100 % in KW 48/49 — +30 % overbooks him.
    expect(toast).toHaveTextContent('KW 48: Lukas Müller 130 % – überbucht');
    expect(await get(JONAS_RELEASE)).toMatchObject({ employeeId: 'emp-02', start: '2026-11-23', end: '2026-12-04' });
  }, 20_000);

  it('drag on an empty row area opens the create drawer prefilled; saving creates the assignment', async () => {
    const { repository, user } = setup();
    await screen.findByRole('grid');
    const before = (await repository.listAssignments()).length;
    // Felix Becker (emp-06) is free from KW 52 (column 6) on.
    const empty = cell('emp-06', '2026-W52');
    drag(empty, { x: 6 * COL + 10 }, { x: 8 * COL + 10 });

    const dialog = await screen.findByRole('dialog', { name: 'Einsatz anlegen' });
    expect(within(dialog).getByRole('combobox', { name: 'Person' })).toHaveValue('emp-06');
    expect(within(dialog).getByLabelText(/^Start/)).toHaveValue('2026-12-21');
    expect(within(dialog).getByLabelText(/^Ende/)).toHaveValue('2027-01-08');
    expect(within(dialog).getByRole('combobox', { name: 'Allokation' })).toHaveValue('50');
    expect(within(dialog).getByRole('button', { name: 'Speichern' })).toBeDisabled();

    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Projekt' }), 'KI-Assistent');
    // Live impact preview from the dry-run.
    const table = await within(dialog).findByTestId('impact-table');
    expect(table).toHaveTextContent('KW 52');
    expect(table).toHaveTextContent('Felix Becker');
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Speichern' })).toBeEnabled());
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }));

    expect(await screen.findByText('Einsatz angelegt')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const all = await repository.listAssignments();
    expect(all).toHaveLength(before + 1);
    expect(all.find((a) => a.employeeId === 'emp-06' && a.start === '2026-12-21')).toMatchObject({
      projectId: 'prj-06',
      end: '2027-01-08',
      allocation: 50,
    });
  }, 20_000);

  it('edit drawer: shows blocking errors inline, saves changes, deletes with undo', async () => {
    const { repository, user, get } = setup();
    await screen.findByRole('grid');
    await user.click(bar(JONAS_RELEASE));
    let dialog = await screen.findByRole('dialog', { name: 'Einsatz bearbeiten' });

    const end = within(dialog).getByLabelText(/^Ende/);
    fireEvent.change(end, { target: { value: '2026-11-01' } });
    expect(await within(dialog).findByText('Enddatum liegt vor dem Startdatum.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Speichern' })).toBeDisabled();

    fireEvent.change(end, { target: { value: '2026-12-04' } });
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Allokation' }), '10');
    const table = await within(dialog).findByTestId('impact-table');
    expect(table).toHaveTextContent('120 %');
    expect(table).toHaveTextContent('100 %');
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Speichern' })).toBeEnabled());
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }));
    expect(await screen.findByText('Einsatz gespeichert')).toBeInTheDocument();
    expect(await get(JONAS_RELEASE)).toMatchObject({ allocation: 10 });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(bar(JONAS_RELEASE));
    dialog = await screen.findByRole('dialog', { name: 'Einsatz bearbeiten' });
    await user.click(within(dialog).getByRole('button', { name: 'Löschen' }));
    const toast = (await screen.findByText('Einsatz gelöscht')).closest<HTMLElement>('[data-testid="action-toast"]')!;
    expect(await get(JONAS_RELEASE)).toBeUndefined();

    await user.click(within(toast).getByRole('button', { name: 'Rückgängig' }));
    await waitFor(async () => {
      const restored = (await repository.listAssignments()).filter((a) => a.employeeId === 'emp-04' && a.projectId === 'prj-02');
      expect(restored).toHaveLength(1);
      expect(restored[0]).toMatchObject({ start: '2026-11-23', end: '2026-12-04', allocation: 10 });
    });
  }, 30_000);

  it('keyboard: arrows move/resize a focused bar, Delete removes it, Ctrl+Z / Ctrl+Shift+Z undo and redo', async () => {
    const { get } = setup();
    await screen.findByRole('grid');

    bar(JONAS_RELEASE).focus();
    fireEvent.keyDown(bar(JONAS_RELEASE), { key: 'ArrowRight' });
    await waitFor(async () => expect(await get(JONAS_RELEASE)).toMatchObject({ start: '2026-11-30', end: '2026-12-11' }));
    await waitFor(() => expect(document.activeElement).toBe(bar(JONAS_RELEASE)));

    fireEvent.keyDown(bar(JONAS_RELEASE), { key: 'ArrowRight', shiftKey: true });
    await waitFor(async () => expect(await get(JONAS_RELEASE)).toMatchObject({ start: '2026-11-30', end: '2026-12-18' }));

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    await waitFor(async () => expect(await get(JONAS_RELEASE)).toMatchObject({ end: '2026-12-11' }));
    expect(screen.getByRole('button', { name: 'Wiederherstellen: Einsatz ändern' })).toBeEnabled();

    fireEvent.keyDown(document.body, { key: 'Z', ctrlKey: true, shiftKey: true });
    await waitFor(async () => expect(await get(JONAS_RELEASE)).toMatchObject({ end: '2026-12-18' }));

    // Typing in a field keeps the browser's own undo.
    const search = screen.getByRole('searchbox', { name: 'Person suchen' });
    fireEvent.keyDown(search, { key: 'z', ctrlKey: true });
    expect(await get(JONAS_RELEASE)).toMatchObject({ end: '2026-12-18' });

    bar(JONAS_RELEASE).focus();
    fireEvent.keyDown(bar(JONAS_RELEASE), { key: 'Delete' });
    expect(await screen.findByText('Einsatz gelöscht')).toBeInTheDocument();
    expect(await get(JONAS_RELEASE)).toBeUndefined();
  }, 30_000);

  it('toolbar: "+ Einsatz" opens an empty create drawer; undo button carries the label', async () => {
    const { user } = setup();
    await screen.findByRole('grid');
    expect(screen.getByRole('button', { name: 'Rückgängig' })).toBeDisabled();

    fireEvent.keyDown(bar(JONAS_RELEASE), { key: 'ArrowLeft' });
    expect(await screen.findByRole('button', { name: 'Rückgängig: Einsatz verschieben' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Einsatz' }));
    const dialog = await screen.findByRole('dialog', { name: 'Einsatz anlegen' });
    expect(within(dialog).getByRole('combobox', { name: 'Person' })).toHaveValue('');
    expect(within(dialog).getByLabelText(/^Start/)).toHaveValue('2026-11-23');
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  }, 20_000);
});
