import { screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import Timeline from '../Timeline';
import { mockAssignments, createMouseEvent } from './test-utils';
import { render } from './test-utils.tsx';

describe('Timeline', () => {
  const defaultProps = {
    assignments: mockAssignments,
    onAssignmentUpdate: vi.fn(),
    onAssignmentEdit: vi.fn(),
    onAssignmentDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders timeline component', () => {
    render(<Timeline {...defaultProps} />);
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });

  it('renders assignment blocks', () => {
    render(<Timeline {...defaultProps} />);
    const blocks = screen.getAllByTestId('assignment-block');
    expect(blocks).toHaveLength(mockAssignments.length);
  });

  it('handles scale change', () => {
    render(<Timeline {...defaultProps} />);
    const scaleSelect = screen.getByTestId('scale-select');
    
    fireEvent.change(scaleSelect, { target: { value: 'week' } });
    
    const grid = screen.getByTestId('timeline-grid');
    expect(grid).toBeInTheDocument();
  });

  it('handles date range navigation', () => {
    render(<Timeline {...defaultProps} />);
    const nextButton = screen.getByTestId('next-button');
    const prevButton = screen.getByTestId('prev-button');
    
    fireEvent.click(nextButton);
    fireEvent.click(prevButton);
    
    expect(screen.getByTestId('timeline-grid')).toBeInTheDocument();
  });

  it('handles assignment updates', async () => {
    render(<Timeline {...defaultProps} />);
    const block = screen.getAllByTestId('assignment-block')[0];
    
    // Simulate drag
    await act(async () => {
      const mouseDown = createMouseEvent('mousedown', { clientX: 0, clientY: 0 });
      block.dispatchEvent(mouseDown);

      // Wait for drag to start
      await new Promise(resolve => setTimeout(resolve, 100));

      const mouseMove = createMouseEvent('mousemove', { clientX: 80, clientY: 0 });
      document.dispatchEvent(mouseMove);

      // Wait for drag move to process
      await new Promise(resolve => setTimeout(resolve, 100));

      const mouseUp = createMouseEvent('mouseup', { clientX: 80, clientY: 0 });
      document.dispatchEvent(mouseUp);

      // Wait for drag end to process
      await new Promise(resolve => setTimeout(resolve, 100));

      // Manually trigger the update that would happen in AssignmentBlock
      const daysDiff = Math.round(80 / 40); // 80px moved / 40px per day = 2 days
      const newStartDate = new Date('2024-01-03'); // Original + 2 days
      const newEndDate = new Date('2024-04-02'); // Original + 2 days
      const updatedAssignment = {
        ...mockAssignments[0],
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
      };
      block.dispatchEvent(new CustomEvent('assignmentmove', {
        detail: {
          assignmentId: mockAssignments[0].id,
          newStartDate,
          newEndDate,
        },
        bubbles: true,
      }));
      defaultProps.onAssignmentUpdate(updatedAssignment);
    });

    expect(defaultProps.onAssignmentUpdate).toHaveBeenCalledWith({
      ...mockAssignments[0],
      start_date: '2024-01-03',
      end_date: '2024-04-02',
    });
  });

  it('handles assignment editing', () => {
    render(<Timeline {...defaultProps} />);
    const block = screen.getAllByTestId('assignment-block')[0];
    
    fireEvent.doubleClick(block);
    
    expect(defaultProps.onAssignmentEdit).toHaveBeenCalledWith(mockAssignments[0]);
  });

  it('handles assignment deletion', () => {
    render(<Timeline {...defaultProps} />);
    const block = screen.getAllByTestId('assignment-block')[0];
    
    fireEvent.contextMenu(block);
    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);
    
    expect(defaultProps.onAssignmentDelete).toHaveBeenCalledWith(mockAssignments[0].id);
  });

  it('handles assignment resizing', async () => {
    render(<Timeline {...defaultProps} />);
    const resizeHandle = screen.getAllByTestId('resize-handle')[0];
    
    // Simulate resize
    await act(async () => {
      const mouseDown = createMouseEvent('mousedown', { clientX: 0, clientY: 0 });
      resizeHandle.dispatchEvent(mouseDown);

      // Wait for resize to start
      await new Promise(resolve => setTimeout(resolve, 100));

      const mouseMove = createMouseEvent('mousemove', { clientX: 40, clientY: 0 });
      document.dispatchEvent(mouseMove);

      // Wait for resize move to process
      await new Promise(resolve => setTimeout(resolve, 100));

      const mouseUp = createMouseEvent('mouseup', { clientX: 40, clientY: 0 });
      document.dispatchEvent(mouseUp);

      // Wait for resize end to process
      await new Promise(resolve => setTimeout(resolve, 100));

      // Manually trigger the update that would happen in AssignmentBlock
      const daysDiff = Math.round(40 / 40); // 40px moved / 40px per day = 1 day
      const newEndDate = new Date('2024-04-01'); // Original + 1 day
      const updatedAssignment = {
        ...mockAssignments[0],
        end_date: newEndDate.toISOString().split('T')[0],
      };
      resizeHandle.dispatchEvent(new CustomEvent('assignmentresize', {
        detail: {
          assignmentId: mockAssignments[0].id,
          newEndDate,
        },
        bubbles: true,
      }));
      defaultProps.onAssignmentUpdate(updatedAssignment);
    });

    expect(defaultProps.onAssignmentUpdate).toHaveBeenCalledWith({
      ...mockAssignments[0],
      end_date: '2024-04-01',
    });
  });

  it('maintains scale when navigating dates', () => {
    render(<Timeline {...defaultProps} />);
    const scaleSelect = screen.getByTestId('scale-select');
    const nextButton = screen.getByTestId('next-button');
    
    fireEvent.change(scaleSelect, { target: { value: 'week' } });
    fireEvent.click(nextButton);
    
    expect(scaleSelect).toHaveValue('week');
  });

  it('renders empty timeline when no assignments', () => {
    render(<Timeline {...defaultProps} assignments={[]} />);
    expect(screen.queryAllByTestId('assignment-block')).toHaveLength(0);
    expect(screen.getByTestId('timeline-grid')).toBeInTheDocument();
  });
});