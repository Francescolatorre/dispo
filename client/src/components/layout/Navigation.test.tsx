import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from './Navigation';
import { renderWithProviders } from '../../test/utils';

describe('Navigation Component', () => {
  it('renders navigation items', () => {
    renderWithProviders(<Navigation />);
    
    // Check if all navigation items are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projekte')).toBeInTheDocument();
    expect(screen.getByText('Mitarbeiter')).toBeInTheDocument();
    expect(screen.getByText('Berichte')).toBeInTheDocument();
  });

  it('renders app title', () => {
    renderWithProviders(<Navigation />);
    expect(screen.getByText('DispoMVP')).toBeInTheDocument();
  });

  it('shows mobile menu button on small screens', async () => {
    renderWithProviders(<Navigation />);
    const menuButton = screen.getByRole('button', { name: /öffnen/i });
    expect(menuButton).toBeInTheDocument();

    // Test mobile menu interaction
    const user = userEvent.setup();
    await user.click(menuButton);
    
    // Verify navigation items are visible after clicking menu button
    const drawer = screen.getByTestId('main-navigation');
    expect(within(drawer).getByText('Dashboard')).toBeVisible();
    expect(within(drawer).getByText('Projekte')).toBeVisible();
    expect(within(drawer).getByText('Mitarbeiter')).toBeVisible();
    expect(within(drawer).getByText('Berichte')).toBeVisible();
  });

  it('has correct navigation links', () => {
    renderWithProviders(<Navigation />);
    
    // Check if links have correct paths
    const links = screen.getAllByRole('link');
    const paths = ['/', '/projects', '/employees', '/reports'];
    
    links.forEach((link, index) => {
      expect(link).toHaveAttribute('href', paths[index]);
    });
  });
});
