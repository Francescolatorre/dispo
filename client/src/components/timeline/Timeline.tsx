import React, { useState, useCallback, useEffect } from 'react';
import { Box, VStack } from '@chakra-ui/react';
import TimeScale from './TimeScale';
import TimelineGrid from './TimelineGrid';
import AssignmentBlock from './AssignmentBlock';
import type { AssignmentWithRelations } from '../../types/assignment';
import { startOfMonth, endOfMonth } from 'date-fns';

interface TimelineProps {
  assignments: AssignmentWithRelations[];
  onAssignmentUpdate: (assignment: AssignmentWithRelations) => void;
  onAssignmentEdit: (assignment: AssignmentWithRelations) => void;
  onAssignmentDelete: (assignmentId: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  assignments,
  onAssignmentUpdate,
  onAssignmentEdit,
  onAssignmentDelete,
}) => {
  const [scale, setScale] = useState<'day' | 'week' | 'month'>('day');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return startOfMonth(date);
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return endOfMonth(date);
  });

  const handleScaleChange = useCallback((newScale: 'day' | 'week' | 'month') => {
    setScale(newScale);
  }, []);

  const handleDateRangeChange = useCallback((newStart: Date, newEnd: Date) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  }, []);

  const handleAssignmentResize = useCallback((assignmentId: number, newEndDate: Date) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const updatedAssignment = {
      ...assignment,
      end_date: newEndDate.toISOString().split('T')[0],
    };

    onAssignmentUpdate(updatedAssignment);
  }, [assignments, onAssignmentUpdate]);

  const handleAssignmentMove = useCallback((
    assignmentId: number,
    newStartDate: Date,
    newEndDate: Date
  ) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const updatedAssignment = {
      ...assignment,
      start_date: newStartDate.toISOString().split('T')[0],
      end_date: newEndDate.toISOString().split('T')[0],
    };

    onAssignmentUpdate(updatedAssignment);
  }, [assignments, onAssignmentUpdate]);

  const columnWidth = {
    day: 40,
    week: 200,
    month: 240,
  }[scale];

  // Handle custom events from AssignmentBlock
  useEffect(() => {
    const handleAssignmentMoveEvent = (e: CustomEvent) => {
      const { assignmentId, newStartDate, newEndDate } = e.detail;
      handleAssignmentMove(assignmentId, newStartDate, newEndDate);
    };

    const handleAssignmentResizeEvent = (e: CustomEvent) => {
      const { assignmentId, newEndDate } = e.detail;
      handleAssignmentResize(assignmentId, newEndDate);
    };

    document.addEventListener('assignmentmove', handleAssignmentMoveEvent as EventListener);
    document.addEventListener('assignmentresize', handleAssignmentResizeEvent as EventListener);

    return () => {
      document.removeEventListener('assignmentmove', handleAssignmentMoveEvent as EventListener);
      document.removeEventListener('assignmentresize', handleAssignmentResizeEvent as EventListener);
    };
  }, [handleAssignmentMove, handleAssignmentResize]);

  // Ensure assignments are re-rendered when scale changes
  useEffect(() => {
    // Force re-render of assignment blocks
    const container = document.querySelector('[data-testid="timeline"]') as HTMLElement;
    if (container) {
      container.style.opacity = '0.99';
      requestAnimationFrame(() => {
        container.style.opacity = '1';
      });
    }
  }, [scale]);

  return (
    <VStack spacing={0} align="stretch" height="100%" data-testid="timeline">
      <TimeScale
        startDate={startDate}
        endDate={endDate}
        scale={scale}
        onScaleChange={handleScaleChange}
        onDateRangeChange={handleDateRangeChange}
      />
      <Box position="relative" flex={1} overflowX="auto" overflowY="hidden">
        <TimelineGrid startDate={startDate} endDate={endDate} scale={scale}>
          {assignments.map(assignment => (
            <AssignmentBlock
              key={assignment.id}
              assignment={assignment}
              timelineStart={startDate}
              columnWidth={columnWidth}
              onResize={handleAssignmentResize}
              onMove={handleAssignmentMove}
              onEdit={onAssignmentEdit}
              onDelete={onAssignmentDelete}
            />
          ))}
        </TimelineGrid>
      </Box>
    </VStack>
  );
};

export default Timeline;