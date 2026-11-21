import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LocalRepository } from '../data/localRepository';
import type { Repository } from '../data/repository';
import { addDays, addWeeks, startOfISOWeek, todayISO } from '../domain/dates';
import { PlanningProvider, usePlanning } from '.';

const wrapperFor =
  (repository: Repository) =>
  ({ children }: { children: ReactNode }) => <PlanningProvider repository={repository}>{children}</PlanningProvider>;

describe('PlanningProvider', () => {
  it('loads the seed data from the repository', async () => {
    const repo = new LocalRepository({ storage: null });
    const { result } = renderHook(() => usePlanning(), { wrapper: wrapperFor(repo) });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.employees).toHaveLength(14);
    expect(result.current.projects).toHaveLength(7);
    expect(result.current.assignments).toHaveLength(30);
    expect(result.current.error).toBeNull();
    expect(result.current.canUndo).toBe(false);
  });

  it('re-reads after an action and undo, updating consumers', async () => {
    const repo = new LocalRepository({ storage: null });
    const { result } = renderHook(() => usePlanning(), { wrapper: wrapperFor(repo) });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const monday = addWeeks(startOfISOWeek(todayISO()), 4);
    await act(async () => {
      const r = await result.current.actions.createAssignment({
        employeeId: 'emp-06',
        projectId: 'prj-01',
        start: monday,
        end: addDays(monday, 4),
        allocation: 50,
      });
      expect(r.ok).toBe(true);
    });
    expect(result.current.assignments).toHaveLength(31);
    expect(result.current.canUndo).toBe(true);

    await act(async () => {
      await result.current.actions.undo();
    });
    expect(result.current.assignments).toHaveLength(30);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('exposes load errors', async () => {
    const repo = new LocalRepository({ storage: null });
    repo.listEmployees = () => Promise.reject(new Error('offline'));
    const { result } = renderHook(() => usePlanning(), { wrapper: wrapperFor(repo) });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('offline');
  });

  it('throws when used outside the provider', () => {
    const Consumer = () => {
      usePlanning();
      return null;
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow('usePlanning must be used inside <PlanningProvider>');
    spy.mockRestore();
  });

  it('renders children', async () => {
    render(
      <PlanningProvider repository={new LocalRepository({ storage: null })}>
        <p>child</p>
      </PlanningProvider>,
    );
    expect(screen.getByText('child')).toBeInTheDocument();
    await act(async () => {}); // let the initial load settle
  });
});
