import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AppRoutes } from './AppRoutes';
import { renderWithProviders } from './test/render';

describe('App', () => {
  beforeEach(() => window.localStorage.clear());

  it('loads seed data via the PlanningProvider and shows a summary', async () => {
    render(<App />);
    expect(await screen.findByTestId('planning-summary')).toHaveTextContent('14 Personen · 7 Projekte · 30 Einsätze');
    expect(window.localStorage.getItem('dispo.v1')).not.toBeNull();
  });

  it('renders the shell with navigation and the planning page at /', async () => {
    render(<App />);
    await screen.findByTestId('planning-summary');

    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' });
    expect(within(nav).getByRole('link', { name: 'Planung' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: 'Personen' })).toHaveAttribute('href', '/people');
    expect(within(nav).getByRole('link', { name: 'Projekte' })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('heading', { level: 1, name: 'Planung' })).toBeInTheDocument();
  });

  describe('WebMCP status line', () => {
    afterEach(() => {
      delete (document as unknown as { modelContext?: unknown }).modelContext;
    });

    it('is hidden when the browser has no WebMCP', async () => {
      render(<App />);
      await screen.findByTestId('planning-summary');
      await act(async () => {});
      expect(screen.queryByTestId('webmcp-status')).toBeNull();
    });

    it('appears in the sidebar footer once the tools are registered', async () => {
      const registerTool = vi.fn();
      (document as unknown as { modelContext: unknown }).modelContext = { registerTool };
      render(<App />);
      const status = await screen.findByTestId('webmcp-status');
      expect(registerTool).toHaveBeenCalledTimes(9);
      const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' });
      expect(nav).toContainElement(status);
      expect(status).toHaveAccessibleName(/^KI-Werkzeuge aktiv \(WebMCP\): 9 Planungswerkzeuge/);
    });
  });
});

describe('AppRoutes', () => {
  it.each([
    ['/', 'Planung'],
    ['/people', 'Personen'],
    ['/projects', 'Projekte'],
  ])('renders the page for %s', async (route, heading) => {
    renderWithProviders(<AppRoutes />, { route });
    await act(async () => {}); // let the PlanningProvider's initial load settle
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('redirects unknown routes to the planning page', async () => {
    renderWithProviders(<AppRoutes />, { route: '/does-not-exist' });
    await act(async () => {});
    expect(screen.getByRole('heading', { level: 1, name: 'Planung' })).toBeInTheDocument();
  });

  it('navigates between pages via the side navigation and marks the active link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />);
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' });

    await user.click(within(nav).getByRole('link', { name: 'Personen' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Personen' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Personen' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Planung' })).not.toHaveAttribute('aria-current');

    await user.click(within(nav).getByRole('link', { name: 'Projekte' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Projekte' })).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: 'Planung' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Planung' })).toBeInTheDocument();
  });
});
