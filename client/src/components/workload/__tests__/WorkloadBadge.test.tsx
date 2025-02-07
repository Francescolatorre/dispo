import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import WorkloadBadge from '../WorkloadBadge';

// Initialize userEvent
const user = userEvent.setup();

// Helper function to wait for tooltip to appear
const waitForTooltipToAppear = async () => {
  let tooltip: HTMLElement | null = null;
  tooltip = await screen.findByRole('tooltip', {}, { timeout: 2000 });
  if (!tooltip) {
    throw new Error('Tooltip not found');
  }
  expect(tooltip).toBeVisible();
  return tooltip;
};

// Helper function to wait for tooltip to disappear
const waitForTooltipToDisappear = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const tooltip = screen.queryByRole('tooltip');
  expect(tooltip).not.toBeInTheDocument();
};

describe('WorkloadBadge', () => {
  const renderWithChakra = (component: React.ReactElement) => {
    return render(
      <ChakraProvider>
        {component}
      </ChakraProvider>
    );
  };

  it('should display workload percentage', () => {
    renderWithChakra(<WorkloadBadge workload={50} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('50%');
    expect(badge).toHaveAttribute('aria-label', 'Current workload is 50 percent');
  });

  it('should show success status for normal workload', async () => {
    renderWithChakra(<WorkloadBadge workload={50} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('data-status', 'success');
    
    // Test tooltip
    await user.hover(badge);
    const tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent('Current workload: 50%');
    
    // Test tooltip dismissal
    await user.unhover(badge);
    await waitForTooltipToDisappear();
  });

  it('should show warning status for high workload', async () => {
    renderWithChakra(<WorkloadBadge workload={85} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('data-status', 'warning');
    
    // Test tooltip
    await user.hover(badge);
    const tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent('Warning: High workload at 85%');
    
    // Test tooltip dismissal
    await user.unhover(badge);
    await waitForTooltipToDisappear();
  });

  it('should show error status for overallocation', async () => {
    renderWithChakra(<WorkloadBadge workload={110} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('data-status', 'error');
    
    // Test tooltip
    await user.hover(badge);
    const tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent('Critical: Workload at 110%');
    
    // Test tooltip dismissal
    await user.unhover(badge);
    await waitForTooltipToDisappear();
  });

  it('should respect custom thresholds', async () => {
    const thresholds = { warning: 50, error: 75 };
    renderWithChakra(
      <WorkloadBadge
        workload={60}
        thresholds={thresholds}
      />
    );
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('data-status', 'warning');
    
    // Test tooltip
    await user.hover(badge);
    const tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent('Warning: High workload at 60%');
    
    // Test tooltip dismissal
    await user.unhover(badge);
    await waitForTooltipToDisappear();
  });

  it('should be accessible and support keyboard navigation', async () => {
    renderWithChakra(<WorkloadBadge workload={85} />);
    const badge = screen.getByRole('status');
    
    // Check ARIA attributes
    expect(badge).toHaveAttribute('aria-label', 'Current workload is 85 percent');
    expect(badge).toHaveAttribute('role', 'status');
    
    // Test keyboard navigation
    await user.tab();
    expect(badge).toHaveFocus();
    const tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent('Warning: High workload at 85%');
    
    // Test escape dismisses tooltip
    await user.keyboard('{Escape}');
    await waitForTooltipToDisappear();
    expect(badge).toHaveFocus(); // Should retain focus after escape
    
    // Test blur removes tooltip
    await user.tab();
    await waitForTooltipToDisappear();
    expect(badge).not.toHaveFocus();
  });

  it('should format workload percentage correctly', () => {
    // Test integer values
    renderWithChakra(<WorkloadBadge workload={50} />);
    expect(screen.getByRole('status')).toHaveTextContent('50%');

    // Test decimal values
    const { rerender } = renderWithChakra(<WorkloadBadge workload={33.33} />);
    expect(screen.getByRole('status')).toHaveTextContent('33%');

    // Test rounding
    rerender(
      <ChakraProvider>
        <WorkloadBadge workload={66.66} />
      </ChakraProvider>
    );
    expect(screen.getByRole('status')).toHaveTextContent('67%');
  });

  it('should update status and message when workload changes', async () => {
    const { rerender } = renderWithChakra(<WorkloadBadge workload={50} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('data-status', 'success');
    
    // Test normal workload tooltip
    await user.hover(badge);
    let tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent('Current workload: 50%');
    await user.unhover(badge);
    await waitForTooltipToDisappear();
    
    // Update to warning state
    rerender(
      <ChakraProvider>
        <WorkloadBadge workload={85} />
      </ChakraProvider>
    );
    expect(badge).toHaveAttribute('data-status', 'warning');
    
    // Test warning tooltip
    await user.hover(badge);
    tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent('Warning: High workload at 85%');
    await user.unhover(badge);
    await waitForTooltipToDisappear();
    
    // Update to error state
    rerender(
      <ChakraProvider>
        <WorkloadBadge workload={110} />
      </ChakraProvider>
    );
    expect(badge).toHaveAttribute('data-status', 'error');
    
    // Test error tooltip
    await user.hover(badge);
    tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent('Critical: Workload at 110%');
    await user.unhover(badge);
    await waitForTooltipToDisappear();
  });
});