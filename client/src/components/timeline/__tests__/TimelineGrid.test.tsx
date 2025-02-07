import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import TimelineGrid from '../TimelineGrid';
import { testDates } from './test-utils';
import { render } from './test-utils.tsx';

describe('TimelineGrid', () => {
  const defaultProps = {
    startDate: testDates.startOfYear,
    endDate: testDates.endOfYear,
    scale: 'day' as const,
  };

  it('should render grid with correct number of columns for full year', () => {
    render(<TimelineGrid {...defaultProps} />);
    const columns = screen.getAllByTestId('grid-column');
    expect(columns).toHaveLength(366); // 2024 is a leap year
  });

  it('should render grid with correct number of columns for partial year', () => {
    const props = {
      ...defaultProps,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-29'),
    };
    render(<TimelineGrid {...props} />);
    const columns = screen.getAllByTestId('grid-column');
    expect(columns).toHaveLength(29); // February 2024 has 29 days (leap year)
  });

  it('should render column labels', () => {
    render(<TimelineGrid {...defaultProps} />);
    const labels = screen.getAllByTestId('day-label');
    expect(labels[0]).toHaveTextContent('1');
    expect(labels[30]).toHaveTextContent('31');
  });

  it('should handle week scale', () => {
    const props = {
      ...defaultProps,
      scale: 'week' as const,
    };
    render(<TimelineGrid {...props} />);
    const columns = screen.getAllByTestId('grid-column');
    expect(columns).toHaveLength(53); // 2024 has 53 weeks
  });

  it('should handle month scale', () => {
    const props = {
      ...defaultProps,
      scale: 'month' as const,
    };
    render(<TimelineGrid {...props} />);
    const columns = screen.getAllByTestId('grid-column');
    expect(columns).toHaveLength(12);
  });

  it('should show weekend columns in day view', () => {
    render(<TimelineGrid {...defaultProps} />);
    const weekendColumns = screen.getAllByTestId('weekend-column');
    expect(weekendColumns.length).toBeGreaterThan(0);
  });

  it('should show today marker', () => {
    const today = new Date();
    const props = {
      startDate: new Date(today.getFullYear(), today.getMonth(), 1),
      endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      scale: 'day' as const,
    };
    render(<TimelineGrid {...props} />);
    expect(screen.getByTestId('today-marker')).toBeInTheDocument();
  });

  it('should show month boundaries', () => {
    render(<TimelineGrid {...defaultProps} />);
    const monthBoundaries = screen.getAllByTestId(/month-boundary/);
    expect(monthBoundaries).toHaveLength(11); // 12 months - 1 (first month)
  });

  it('should handle invalid date ranges', () => {
    const props = {
      ...defaultProps,
      startDate: new Date('invalid'),
    };
    render(<TimelineGrid {...props} />);
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
  });

  it('should handle end date before start date', () => {
    const props = {
      ...defaultProps,
      startDate: new Date('2024-12-31'),
      endDate: new Date('2024-01-01'),
    };
    render(<TimelineGrid {...props} />);
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
  });

  it('should render children', () => {
    render(
      <TimelineGrid {...defaultProps}>
        <div data-testid="test-child">Test Content</div>
      </TimelineGrid>
    );
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should position children correctly', () => {
    render(
      <TimelineGrid {...defaultProps}>
        <div data-testid="test-child" style={{ position: 'absolute', left: '100px' }}>
          Test Content
        </div>
      </TimelineGrid>
    );
    const child = screen.getByTestId('test-child');
    expect(child).toHaveStyle({ position: 'absolute', left: '100px' });
  });
});