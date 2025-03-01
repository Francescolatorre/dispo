import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Layout } from './Layout';
import { renderWithProviders } from '../../test/utils';

describe('Layout Component', () => {
  const testContent = 'Test Content';

  it('renders children content', () => {
    renderWithProviders(
      <Layout>
        <div>{testContent}</div>
      </Layout>
    );
    
    const main = screen.getByRole('main');
    expect(within(main).getByText(testContent)).toBeInTheDocument();
  });

  it('includes navigation component', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    // Check for navigation elements
    const nav = screen.getByTestId('main-navigation');
    expect(nav).toBeInTheDocument();
    expect(within(nav).getByText('Dashboard')).toBeInTheDocument();
  });

  it('has proper structure', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    // Check for main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    
    // Check for navigation drawer
    expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
  });

  it('applies correct spacing', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    const main = screen.getByRole('main');
    const computedStyle = window.getComputedStyle(main);
    expect(computedStyle.padding).toBeDefined();
    expect(computedStyle.boxSizing).toBe('border-box');
  });
});
