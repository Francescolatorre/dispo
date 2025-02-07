import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import WorkloadIndicator from '../WorkloadIndicator';
import type { AssignmentWithRelations } from '../../../types/assignment';

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

// Helper function to create mock assignment
const createMockAssignment = (allocation: number): AssignmentWithRelations => ({
  id: 1,
  project_id: 1,
  employee_id: 1,
  role: 'Developer',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  allocation_percentage: allocation,
  status: 'active',
  dr_status: 'DR2',
  position_status: 'P2',
  project_name: 'Project A',
  employee_name: 'John Doe',
});

describe('WorkloadIndicator', () => {
  const renderWithChakra = (component: React.ReactElement) => {
    return render(
      <ChakraProvider>
        {component}
      </ChakraProvider>
    );
  };

  it('should display workload badge', () => {
    renderWithChakra(
      <WorkloadIndicator 
        workload={50}
        assignments={[createMockAssignment(50)]}
      />
    );
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('50%');
    expect(badge).toHaveAttribute('aria-label', 'Current workload is 50 percent');
  });

  it('should show warning icon with tooltip for high workload', async () => {
    const { container } = renderWithChakra(
      <WorkloadIndicator 
        workload={85}
        assignments={[createMockAssignment(85)]}
      />
    );
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('data-status', 'warning');

    // Wait for warning to be rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    const warning = container.querySelector('[role="alert"]');
    expect(warning).toBeInTheDocument();

    await user.hover(warning!);
    const tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent(/high workload/i);

    // Test keyboard interaction
    await user.keyboard('{Tab}');
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(warning).toHaveFocus();
    const focusTooltip = await waitForTooltipToAppear();
    expect(focusTooltip).toHaveTextContent(/high workload/i);

    // Test tooltip dismissal
    await user.keyboard('{Escape}');
    await waitForTooltipToDisappear();
  });

  it('should show error icon with tooltip for overallocation', async () => {
    const { container } = renderWithChakra(
      <WorkloadIndicator 
        workload={110}
        assignments={[createMockAssignment(110)]}
      />
    );
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('data-status', 'error');

    // Wait for warning to be rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    const warning = container.querySelector('[role="alert"]');
    expect(warning).toBeInTheDocument();

    await user.hover(warning!);
    const tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent(/critical.*workload/i);

    // Test keyboard interaction
    await user.keyboard('{Tab}');
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(warning).toHaveFocus();
    const focusTooltip = await waitForTooltipToAppear();
    expect(focusTooltip).toHaveTextContent(/critical.*workload/i);

    // Test tooltip dismissal
    await user.keyboard('{Escape}');
    await waitForTooltipToDisappear();
  });

  it('should not show warning icon when disabled', () => {
    renderWithChakra(
      <WorkloadIndicator 
        workload={85}
        assignments={[createMockAssignment(85)]}
        showWarning={false}
      />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should calculate workload from assignments', () => {
    renderWithChakra(
      <WorkloadIndicator
        workload={0}
        assignments={[createMockAssignment(60)]}
      />
    );
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('60%');
    expect(badge).toHaveAttribute('aria-label', 'Current workload is 60 percent');
  });

  it('should respect custom thresholds with appropriate warnings', async () => {
    const thresholds = { warning: 50, error: 75 };
    const { container } = renderWithChakra(
      <WorkloadIndicator
        workload={60}
        assignments={[createMockAssignment(60)]}
        thresholds={thresholds}
      />
    );
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('data-status', 'warning');

    // Wait for warning to be rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    const warning = container.querySelector('[role="alert"]');
    expect(warning).toBeInTheDocument();

    await user.hover(warning!);
    const tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent(/high workload/i);
  });

  it('should handle current assignment exclusion', () => {
    const assignments = [
      createMockAssignment(60),
      {
        ...createMockAssignment(30),
        id: 2,
      },
    ];

    renderWithChakra(
      <WorkloadIndicator
        workload={30}
        assignments={assignments}
        currentAssignmentId={2}
      />
    );
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('60%');
    expect(badge).toHaveAttribute('aria-label', 'Current workload is 60 percent');
  });

  it('should be accessible and support keyboard navigation', async () => {
    const { container } = renderWithChakra(
      <WorkloadIndicator 
        workload={85}
        assignments={[createMockAssignment(85)]}
      />
    );
    
    // Check badge accessibility
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Current workload is 85 percent');
    
    // Wait for warning to be rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    const warning = container.querySelector('[role="alert"]');
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveAttribute('aria-label', expect.stringMatching(/high workload/i));
    
    // Test keyboard navigation
    await user.keyboard('{Tab}');
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(warning).toHaveFocus();
    
    // Test tooltip appears on focus
    const tooltip = await waitForTooltipToAppear();
    expect(tooltip).toBeVisible();
    
    // Test escape dismisses tooltip
    await user.keyboard('{Escape}');
    await waitForTooltipToDisappear();
    expect(warning).toHaveFocus(); // Should retain focus after escape
    
    // Test blur removes tooltip
    await user.keyboard('{Tab}');
    await waitForTooltipToDisappear();
    expect(warning).not.toHaveFocus();
  });

  it('should update warning messages based on workload changes', async () => {
    const { container, rerender } = renderWithChakra(
      <WorkloadIndicator 
        workload={85}
        assignments={[createMockAssignment(85)]}
      />
    );
    
    // Wait for warning to be rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    let warning = container.querySelector('[role="alert"]');
    expect(warning).toBeInTheDocument();
    await user.hover(warning!);
    let tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent(/high workload/i);
    
    // Update to error state
    rerender(
      <ChakraProvider>
        <WorkloadIndicator 
          workload={110}
          assignments={[createMockAssignment(110)]}
        />
      </ChakraProvider>
    );
    
    // Wait for warning to be rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    warning = container.querySelector('[role="alert"]');
    expect(warning).toBeInTheDocument();
    await user.hover(warning!);
    tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent(/critical.*workload/i);
    
    // Update to normal state
    rerender(
      <ChakraProvider>
        <WorkloadIndicator 
          workload={50}
          assignments={[createMockAssignment(50)]}
        />
      </ChakraProvider>
    );
    
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
  });
});