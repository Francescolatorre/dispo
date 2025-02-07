import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TimeScale from '../TimeScale';
import { startOfDay } from 'date-fns';
import { render } from './test-utils.tsx';

describe('TimeScale', () => {
  const defaultProps = {
    startDate: startOfDay(new Date('2024-01-01')),
    endDate: startOfDay(new Date('2024-01-31')),
    scale: 'day' as const,
    onScaleChange: vi.fn(),
    onDateRangeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders scale selector with correct options', () => {
    render(<TimeScale {...defaultProps} />);
    const select = screen.getByTestId('scale-select');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  it('calls onScaleChange when scale is changed', () => {
    render(<TimeScale {...defaultProps} />);
    const select = screen.getByTestId('scale-select');
    fireEvent.change(select, { target: { value: 'week' } });
    expect(defaultProps.onScaleChange).toHaveBeenCalledWith('week');
  });

  it('handles previous month navigation', () => {
    render(<TimeScale {...defaultProps} />);
    const prevButton = screen.getByTestId('prev-button');
    fireEvent.click(prevButton);
    expect(defaultProps.onDateRangeChange).toHaveBeenCalled();
  });

  it('handles next month navigation', () => {
    render(<TimeScale {...defaultProps} />);
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);
    expect(defaultProps.onDateRangeChange).toHaveBeenCalled();
  });

  it('shows tooltips on hover', async () => {
    render(<TimeScale {...defaultProps} />);
    const prevButton = screen.getByTestId('prev-button');
    const nextButton = screen.getByTestId('next-button');

    // Hover over previous button
    fireEvent.mouseEnter(prevButton);
    await waitFor(() => {
      expect(screen.getByText('Previous month')).toBeInTheDocument();
    });

    // Move to next button
    fireEvent.mouseLeave(prevButton);
    fireEvent.mouseEnter(nextButton);
    await waitFor(() => {
      expect(screen.getByText('Next month')).toBeInTheDocument();
    });
  });

  it('maintains selected scale after navigation', () => {
    render(<TimeScale {...defaultProps} scale="week" />);
    const select = screen.getByTestId('scale-select');
    expect(select).toHaveValue('week');

    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);

    expect(select).toHaveValue('week');
  });

  it('updates date range correctly', () => {
    render(<TimeScale {...defaultProps} />);
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);

    expect(defaultProps.onDateRangeChange).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date)
    );
  });
});