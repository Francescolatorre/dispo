import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalRepository } from '../../data/localRepository';
import { renderWithProviders } from '../../test/render';
import { getModelContext, registerTools, type ModelContextLike, type ModelContextTool, type RegisterToolOptions } from './modelContext';
import { PLANNING_TOOL_NAMES } from './tools';
import { WebMCPBridge } from './WebMCPBridge';

/** Minimal fake of the browser's ModelContext: tools live until their signal aborts. */
function createFakeModelContext() {
  const tools = new Map<string, ModelContextTool>();
  const registerTool = vi.fn((tool: ModelContextTool, options?: RegisterToolOptions) => {
    if (tools.has(tool.name)) throw new Error(`duplicate tool ${tool.name}`);
    tools.set(tool.name, tool);
    options?.signal?.addEventListener('abort', () => tools.delete(tool.name));
  });
  return { tools, registerTool, context: { registerTool } satisfies ModelContextLike };
}

function install(target: object, value: unknown) {
  Object.defineProperty(target, 'modelContext', { value, configurable: true, writable: true });
}

afterEach(() => {
  delete (document as unknown as { modelContext?: unknown }).modelContext;
  delete (navigator as unknown as { modelContext?: unknown }).modelContext;
});

const TODAY = () => '2026-11-25';
const repo = () => new LocalRepository({ storage: null, today: TODAY() });

describe('getModelContext / registerTools', () => {
  it('prefers document.modelContext, falls back to navigator.modelContext, else undefined', () => {
    expect(getModelContext()).toBeUndefined();
    const nav = createFakeModelContext();
    install(navigator, nav.context);
    expect(getModelContext()).toBe(nav.context);
    const doc = createFakeModelContext();
    install(document, doc.context);
    expect(getModelContext()).toBe(doc.context);
    install(document, {}); // not a ModelContext → ignored
    expect(getModelContext()).toBe(nav.context);
  });

  it('collects rejected registrations instead of throwing and is a no-op without an API', async () => {
    const fake = createFakeModelContext();
    const tool = (name: string): ModelContextTool => ({ name, description: 'd', inputSchema: { type: 'object' }, execute: async () => ({}) });
    const controller = new AbortController();
    const result = await registerTools([tool('a'), tool('a'), tool('b')], controller.signal, fake.context);
    expect(result.registered).toEqual(['a', 'b']);
    expect(result.failed).toEqual([{ name: 'a', error: 'duplicate tool a' }]);
    controller.abort();
    expect(fake.tools.size).toBe(0);
    expect(await registerTools([tool('c')], new AbortController().signal, undefined)).toEqual({ registered: [], failed: [] });
  });
});

describe('<WebMCPBridge />', () => {
  it('registers all tools on document.modelContext once data is loaded and unregisters on unmount', async () => {
    const fake = createFakeModelContext();
    install(document, fake.context);
    const onRegistered = vi.fn();
    const { unmount } = renderWithProviders(<WebMCPBridge today={TODAY} onRegistered={onRegistered} />, { repository: repo() });

    await waitFor(() => expect(onRegistered).toHaveBeenCalled());
    expect([...fake.tools.keys()]).toEqual(PLANNING_TOOL_NAMES);
    expect(onRegistered).toHaveBeenLastCalledWith({ registered: PLANNING_TOOL_NAMES, failed: [] });
    for (const [, options] of fake.registerTool.mock.calls) expect(options?.signal).toBeInstanceOf(AbortSignal);

    unmount();
    expect(fake.tools.size).toBe(0);
  });

  it('uses the deprecated navigator.modelContext when document.modelContext is missing', async () => {
    const fake = createFakeModelContext();
    install(navigator, fake.context);
    renderWithProviders(<WebMCPBridge today={TODAY} />, { repository: repo() });
    await waitFor(() => expect(fake.tools.size).toBe(PLANNING_TOOL_NAMES.length));
  });

  it('is a no-op without WebMCP', async () => {
    const onRegistered = vi.fn();
    renderWithProviders(
      <>
        <WebMCPBridge today={TODAY} onRegistered={onRegistered} />
        <span data-testid="child">ok</span>
      </>,
      { repository: repo() },
    );
    expect(await screen.findByTestId('child')).toBeInTheDocument();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it('tool writes update the app state and show an undo toast attributed to the agent', async () => {
    const fake = createFakeModelContext();
    install(document, fake.context);
    const repository = repo();
    renderWithProviders(<WebMCPBridge today={TODAY} />, { repository });
    await waitFor(() => expect(fake.tools.size).toBe(PLANNING_TOOL_NAMES.length));

    let result: Record<string, unknown> = {};
    await act(async () => {
      result = await fake.tools.get('update_assignment')!.execute({ id: 'asg-01', shiftWeeks: 1 });
    });
    expect(result).toMatchObject({ ok: true, undoLabel: 'Einsatz verschieben' });
    expect((await repository.listAssignments()).find((a) => a.id === 'asg-01')?.start).toBe('2026-11-02');

    const toast = await screen.findByTestId('undo-toast');
    expect(toast).toHaveTextContent('Einsatz verschoben – durch KI-Assistent');

    // A subsequent read sees the new state immediately.
    let workload: Record<string, unknown> = {};
    await act(async () => {
      workload = await fake.tools.get('get_workload')!.execute({ employeeIds: ['emp-01'], from: '2026-11-02', to: '2026-11-06' });
    });
    const [anna] = workload.employees as Array<{ assignments: Array<{ id: string; start: string }> }>;
    expect(anna.assignments.find((a) => a.id === 'asg-01')?.start).toBe('2026-11-02');

    // "Rückgängig" in the toast reverts the agent's change.
    await userEvent.click(screen.getByRole('button', { name: 'Rückgängig' }));
    await waitFor(async () =>
      expect((await repository.listAssignments()).find((a) => a.id === 'asg-01')?.start).toBe('2026-10-26'),
    );
  });
});
