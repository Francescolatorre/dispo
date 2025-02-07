import { screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import TimelineDemo from '../TimelineDemo';
import {
  testDates,
  generateTestAssignments,
} from '../../components/timeline/__tests__/test-utils';
import { renderWithProviders } from '../../test/test-utils';

describe('TimelineDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(testDates.today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render timeline demo page', () => {
    renderWithProviders(<TimelineDemo />);
    expect(screen.getByText('Timeline Demo')).toBeInTheDocument();
    expect(screen.getByText(/Interactive demonstration/)).toBeInTheDocument();
  });

  it('should start with empty timeline', () => {
    renderWithProviders(<TimelineDemo />);
    expect(screen.queryAllByTestId('assignment-block')).toHaveLength(0);
  });

  it('should add sample assignments', () => {
    renderWithProviders(<TimelineDemo />);
    const addButton = screen.getByRole('button', { name: /add sample/i });
    fireEvent.click(addButton);
    expect(screen.getAllByTestId('assignment-block')).toHaveLength(5);
  });

  it('should clear assignments', () => {
    renderWithProviders(<TimelineDemo />);
    
    // Add assignments first
    const addButton = screen.getByRole('button', { name: /add sample/i });
    fireEvent.click(addButton);
    expect(screen.getAllByTestId('assignment-block')).toHaveLength(5);

    // Clear assignments
    const clearButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearButton);
    expect(screen.queryAllByTestId('assignment-block')).toHaveLength(0);
  });

  it('should show instructions', () => {
    renderWithProviders(<TimelineDemo />);
    expect(screen.getByRole('heading', { name: /instructions/i })).toBeInTheDocument();
    expect(screen.getByText(/drag assignments/i)).toBeInTheDocument();
    expect(screen.getByText(/double-click to edit/i)).toBeInTheDocument();
  });

  it('should handle assignment updates', () => {
    renderWithProviders(<TimelineDemo />);
    
    // Add assignments
    fireEvent.click(screen.getByRole('button', { name: /add sample/i }));
    const blocks = screen.getAllByTestId('assignment-block');
    
    // Simulate drag
    fireEvent.mouseDown(blocks[0], { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 100, clientY: 0 });
    fireEvent.mouseUp(document);

    // Check for update toast
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });

  it('should handle assignment deletion', () => {
    renderWithProviders(<TimelineDemo />);
    
    // Add assignments
    fireEvent.click(screen.getByRole('button', { name: /add sample/i }));
    const initialCount = screen.getAllByTestId('assignment-block').length;

    // Delete first assignment
    const firstBlock = screen.getAllByTestId('assignment-block')[0];
    fireEvent.contextMenu(firstBlock);
    const deleteButton = screen.getByRole('menuitem', { name: 'Delete' });
    fireEvent.click(deleteButton);

    // Check count reduced by 1
    expect(screen.getAllByTestId('assignment-block')).toHaveLength(initialCount - 1);
  });

  it('should add assignments for different employees', () => {
    renderWithProviders(<TimelineDemo />);
    
    // Add first batch
    fireEvent.click(screen.getByRole('button', { name: /add sample/i }));
    const firstBatchCount = screen.getAllByTestId('assignment-block').length;
    
    // Add second batch (should be for different employee)
    fireEvent.click(screen.getByRole('button', { name: /add sample/i }));
    const totalCount = screen.getAllByTestId('assignment-block').length;
    
    expect(totalCount).toBe(firstBatchCount + 3);
  });

  it('should be accessible', () => {
    renderWithProviders(<TimelineDemo />);
    
    // Check for ARIA labels
    expect(screen.getByRole('button', { name: /add sample/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    
    // Check for semantic headings
    expect(screen.getByRole('heading', { name: /timeline demo/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /instructions/i })).toBeInTheDocument();
  });
});