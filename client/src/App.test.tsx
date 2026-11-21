import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AppRoutes } from './AppRoutes';
import { renderWithProviders } from './test/render';

describe('App', () => {
  it('renders the shell with navigation and the planning page at /', () => {
    render(<App />);

    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' });
    expect(within(nav).getByRole('link', { name: 'Planung' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: 'Personen' })).toHaveAttribute('href', '/people');
    expect(within(nav).getByRole('link', { name: 'Projekte' })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('heading', { level: 1, name: 'Planung' })).toBeInTheDocument();
  });
});

describe('AppRoutes', () => {
  it.each([
    ['/', 'Planung'],
    ['/people', 'Personen'],
    ['/projects', 'Projekte'],
  ])('renders the page for %s', (route, heading) => {
    renderWithProviders(<AppRoutes />, { route });
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('redirects unknown routes to the planning page', () => {
    renderWithProviders(<AppRoutes />, { route: '/does-not-exist' });
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
