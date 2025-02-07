import { render, screen } from '@testing-library/react';
import type { Screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import WorkloadWarning from '../WorkloadWarning';
import { vi } from 'vitest';

// Initialize userEvent
const user = userEvent.setup();

// Helper to advance timers and flush promises
// Helper function to wait for tooltip to disappear
const waitForTooltipToDisappear = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const tooltip = screen.queryByRole('tooltip');
  expect(tooltip).not.toBeInTheDocument();
};

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

// Helper function to test tooltip interactions
const testTooltip = async (trigger: HTMLElement, expectedContent: string | { title: string; description: string }) => {
  // Test mouse interaction
  await user.hover(trigger);
  await new Promise(resolve => setTimeout(resolve, 300));
  const tooltip = await waitForTooltipToAppear();
  
  if (typeof expectedContent === 'string') {
    expect(tooltip).toHaveTextContent(expectedContent);
  } else {
    expect(tooltip).toHaveTextContent(expectedContent.title);
    expect(tooltip).toHaveTextContent(expectedContent.description);
  }
  
  // Test mouse leave
  await user.unhover(trigger);
  await waitForTooltipToDisappear();
  
  // Test keyboard focus
  await user.keyboard('{Tab}'); // Focus the trigger
  await new Promise(resolve => setTimeout(resolve, 300));
  expect(trigger).toHaveFocus();
  
  // Tooltip should appear on focus
  const focusTooltip = await waitForTooltipToAppear();
  if (typeof expectedContent === 'string') {
    expect(focusTooltip).toHaveTextContent(expectedContent);
  } else {
    expect(focusTooltip).toHaveTextContent(expectedContent.title);
    expect(focusTooltip).toHaveTextContent(expectedContent.description);
  }
  
  // Test keyboard blur
  await user.keyboard('{Tab}'); // Move focus away
  await waitForTooltipToDisappear();
};

describe('WorkloadWarning', () => {
  beforeEach(() => {
    document.body.focus();
  });

  const renderWithChakra = (component: React.ReactElement) => {
    return render(
      <ChakraProvider>
        {component}
      </ChakraProvider>
    );
  };

  it('should display warning icon for high workload', () => {
    renderWithChakra(
      <WorkloadWarning
        workload={85}
        message="High workload detected"
      />
    );
    const icon = screen.getByTestId('warning-icon');
    expect(icon).toBeInTheDocument();
  });

  it('should display error icon for overallocation', () => {
    renderWithChakra(
      <WorkloadWarning
        workload={110}
        message="Workload exceeds 100%"
        type="error"
      />
    );
    const icon = screen.getByTestId('error-icon');
    expect(icon).toBeInTheDocument();
  });

  it('should show tooltip with warning message and handle interactions', async () => {
    const message = 'Employee is approaching maximum capacity';
    renderWithChakra(
      <WorkloadWarning
        workload={85}
        message={message}
      />
    );
    const trigger = screen.getByRole('alert');
    await testTooltip(trigger, message);
  });

  it('should not render when workload is normal', () => {
    renderWithChakra(
      <WorkloadWarning
        workload={50}
        message="No warning needed"
      />
    );
    const icon = screen.queryByTestId('warning-icon');
    expect(icon).not.toBeInTheDocument();
  });

  it('should use custom thresholds if provided', async () => {
    const message = 'Warning at custom threshold';
    renderWithChakra(
      <WorkloadWarning
        workload={70}
        message={message}
        thresholds={{ warning: 70, error: 90 }}
      />
    );
    const trigger = screen.getByRole('alert');
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    await testTooltip(trigger, message);
  });

  it('should be accessible and support keyboard navigation', async () => {
    const message = 'High workload warning';
    renderWithChakra(
      <WorkloadWarning
        workload={85}
        message={message}
      />
    );
    const trigger = screen.getByRole('alert');
    
    // Check ARIA attributes
    expect(trigger).toHaveAttribute('aria-label', message);
    expect(trigger).toHaveAttribute('role', 'alert');
    
    // Test keyboard navigation
    await user.keyboard('{Tab}');
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(trigger).toHaveFocus();
    const tooltip = await waitForTooltipToAppear();
    expect(tooltip).toHaveTextContent(message);
    
    // Test escape key dismisses tooltip
    await user.keyboard('{Escape}');
    await waitForTooltipToDisappear();
    expect(trigger).toHaveFocus(); // Should retain focus after escape
    
    // Test blur removes tooltip
    await user.keyboard('{Tab}');
    await waitForTooltipToDisappear();
    expect(trigger).not.toHaveFocus();
  });

  it('should handle different message types with proper interactions', async () => {
    const complexMessage = { 
      title: 'Warning', 
      description: 'Details about the warning' 
    };
    const { rerender } = renderWithChakra(
      <WorkloadWarning
        workload={85}
        message={complexMessage}
      />
    );
    
    // Test complex message
    const trigger = screen.getByRole('alert');
    await testTooltip(trigger, complexMessage);

    // Test simple message
    const simpleMessage = 'Simple warning message';
    rerender(
      <ChakraProvider>
        <WorkloadWarning
          workload={85}
          message={simpleMessage}
        />
      </ChakraProvider>
    );
    
    const newTrigger = screen.getByRole('alert');
    await testTooltip(newTrigger, simpleMessage);
  });
});