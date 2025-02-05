import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { renderWithProviders } from './test/utils';

describe('App Component', () => {
  it('renders dashboard by default', () => {
    renderWithProviders(<App />);
    
    // Check for dashboard content
    const main = screen.getByRole('main');
    expect(within(main).getByText('Dashboard')).toBeInTheDocument();
    expect(within(main).getByText(/willkommen im dispomvp dashboard/i)).toBeInTheDocument();
  });

  it('navigates between pages', async () => {
    renderWithProviders(<App />);
    const user = userEvent.setup();

    // Navigate to Projects
    const nav = screen.getByTestId('main-navigation');
    await user.click(within(nav).getByText('Projekte'));
    expect(screen.getByText(/neues projekt/i)).toBeInTheDocument();

    // Navigate to Employees
    await user.click(within(nav).getByText('Mitarbeiter'));
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading')).toHaveTextContent('Mitarbeiter');
    expect(within(main).getByText(/verwalten sie hier ihre mitarbeiter/i)).toBeInTheDocument();

    // Navigate to Reports
    await user.click(within(nav).getByText('Berichte'));
    expect(screen.getByText(/detaillierte auswertungen/i)).toBeInTheDocument();

    // Navigate back to Dashboard
    await user.click(within(nav).getByText('Dashboard'));
    expect(screen.getByText(/willkommen im dispomvp dashboard/i)).toBeInTheDocument();
  });

  it('maintains layout structure across routes', async () => {
    renderWithProviders(<App />);
    const user = userEvent.setup();

    // Check initial layout
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Navigate and check if layout persists
    await user.click(within(screen.getByTestId('main-navigation')).getByText('Projekte'));
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('applies theme correctly', () => {
    renderWithProviders(<App />);
    
    // Check if theme is applied to AppBar
    const appBar = screen.getByRole('banner');
    const computedStyle = window.getComputedStyle(appBar);
    expect(computedStyle.backgroundColor).toBeDefined();
    
    // Check if CssBaseline is applied (body styles)
    const body = document.body;
    const bodyStyle = window.getComputedStyle(body);
    expect(bodyStyle.margin).toBe('0px');
  });
});
