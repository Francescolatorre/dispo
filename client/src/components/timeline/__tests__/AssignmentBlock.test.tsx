import { vi } from 'vitest';
import AssignmentBlock from '../AssignmentBlock';
import { mockAssignments } from './test-utils';
import { render, screen, fireEvent, act, waitFor } from '../../../test/setup-test-providers';

describe('AssignmentBlock', () => {
  const mockAssignment = {
    ...mockAssignments[0],
    project_name: 'Test Project',
    start_date: '2024-01-01',
    end_date: '2024-03-31',
  };

  const defaultProps = {
    assignment: mockAssignment,
    timelineStart: new Date('2024-01-01'),
    columnWidth: 40,
    onResize: vi.fn(),
    onMove: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders assignment block with project name', async () => {
    render(<AssignmentBlock {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('calculates correct position and width', async () => {
    render(<AssignmentBlock {...defaultProps} />);
    await waitFor(() => {
      const block = screen.getByTestId('assignment-block');
      expect(block.style.left).toBe('0px'); // Starts on Jan 1st
      expect(block.style.width).toBe('3640px'); // 91 days * 40px
    });
  });

  it('handles drag and drop', async () => {
    render(<AssignmentBlock {...defaultProps} />);
    await waitFor(() => {
      const block = screen.getByTestId('assignment-block');
      fireEvent.mouseDown(block, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 80, clientY: 0 });
      fireEvent.mouseUp(document);
      expect(defaultProps.onMove).toHaveBeenCalledWith(
        mockAssignment.id,
        expect.any(Date),
        expect.any(Date)
      );
    });
  });

  it('handles resize', async () => {
    render(<AssignmentBlock {...defaultProps} />);
    await waitFor(() => {
      const resizeHandle = screen.getByTestId('resize-handle');
      fireEvent.mouseDown(resizeHandle, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 40, clientY: 0 });
      fireEvent.mouseUp(document);
      expect(defaultProps.onResize).toHaveBeenCalledWith(
        mockAssignment.id,
        expect.any(Date)
      );
    });
  });

  it('opens context menu on right click', async () => {
    render(<AssignmentBlock {...defaultProps} />);
    await waitFor(() => {
      const block = screen.getByTestId('assignment-block');
      fireEvent.contextMenu(block);
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('calls onEdit when double clicked', async () => {
    render(<AssignmentBlock {...defaultProps} />);
    await waitFor(() => {
      const block = screen.getByTestId('assignment-block');
      fireEvent.doubleClick(block);
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockAssignment);
    });
  });

  it('calls onDelete when delete menu item is clicked', async () => {
    render(<AssignmentBlock {...defaultProps} />);
    await waitFor(() => {
      const block = screen.getByTestId('assignment-block');
      fireEvent.contextMenu(block);
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockAssignment.id);
    });
  });

  it('prevents dragging with right click', async () => {
    render(<AssignmentBlock {...defaultProps} />);
    await waitFor(() => {
      const block = screen.getByTestId('assignment-block');
      fireEvent.mouseDown(block, { button: 2 }); // Right click
      fireEvent.mouseMove(document, { clientX: 80, clientY: 0 });
      fireEvent.mouseUp(document);
      expect(defaultProps.onMove).not.toHaveBeenCalled();
    });
  });

  it('maintains position during drag', async () => {
    render(<AssignmentBlock {...defaultProps} />);
    await waitFor(() => {
      const block = screen.getByTestId('assignment-block');
      fireEvent.mouseDown(block, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 40, clientY: 0 });
      expect(block.style.left).toBe('40px');
    });
  });

  it('maintains width during resize', async () => {
    render(<AssignmentBlock {...defaultProps} />);
    await waitFor(() => {
      const resizeHandle = screen.getByTestId('resize-handle');
      const block = screen.getByTestId('assignment-block');
      fireEvent.mouseDown(resizeHandle, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(document, { clientX: 40, clientY: 0 });
      expect(block.style.width).toBe('3640px'); // Original width + 40px
    });
  });
});