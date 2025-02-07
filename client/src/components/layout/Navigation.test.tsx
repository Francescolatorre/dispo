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

  // Mobile menu test removed since we're using responsive layout instead of a menu button

  it('has correct navigation links', () => {
    renderWithProviders(<Navigation />);
    
    // Check if links have correct paths
    const links = screen.getAllByRole('link');
    const paths = ['/dashboard', '/projects', '/employees', '/reports'];
    
    links.forEach((link, index) => {
      expect(link).toHaveAttribute('href', paths[index]);
    });
  });
});
