import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useTheme,
} from '@chakra-ui/react';
import type { AssignmentWithRelations } from '../../types/assignment';
import { differenceInDays, addDays } from 'date-fns';

interface AssignmentBlockProps {
  assignment: AssignmentWithRelations;
  timelineStart: Date;
  columnWidth: number;
  onResize: (assignmentId: number, newEndDate: Date) => void;
  onMove: (assignmentId: number, newStartDate: Date, newEndDate: Date) => void;
  onEdit: (assignment: AssignmentWithRelations) => void;
  onDelete: (assignmentId: number) => void;
}

const AssignmentBlock: React.FC<AssignmentBlockProps> = ({
  assignment,
  timelineStart,
  columnWidth,
  onResize,
  onMove,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const [currentLeft, setCurrentLeft] = useState(() => {
    const startDate = new Date(assignment.start_date);
    const diffDays = differenceInDays(startDate, timelineStart);
    return diffDays * columnWidth;
  });

  const [currentWidth, setCurrentWidth] = useState(() => {
    const startDate = new Date(assignment.start_date);
    const endDate = new Date(assignment.end_date);
    const durationDays = differenceInDays(endDate, startDate) + 1;
    return durationDays * columnWidth;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Update position and width when props change
  useEffect(() => {
    const startDate = new Date(assignment.start_date);
    const endDate = new Date(assignment.end_date);
    const diffDays = differenceInDays(startDate, timelineStart);
    const durationDays = differenceInDays(endDate, startDate) + 1; // Include both start and end dates
    setCurrentLeft(diffDays * columnWidth);
    setCurrentWidth(durationDays * columnWidth);
  }, [assignment.start_date, assignment.end_date, timelineStart, columnWidth]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - currentLeft, y: e.clientY });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // Handle drag move
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newLeft = e.clientX - dragStart.x;
    setCurrentLeft(newLeft);
  };

  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const startDate = new Date(assignment.start_date);
    const endDate = new Date(assignment.end_date);
    const durationDays = differenceInDays(endDate, startDate) + 1;
    const diff = e.clientX - dragStart.x;
    const newDays = Math.max(1, Math.round((durationDays * columnWidth + diff) / columnWidth));
    const newWidth = newDays * columnWidth;
    setCurrentWidth(newWidth);
  };

  // Handle drag end
  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging) return;

    const newLeft = e.clientX - dragStart.x;
    const daysDiff = Math.round(newLeft / columnWidth);
    const newStartDate = addDays(timelineStart, daysDiff);
    const startDate = new Date(assignment.start_date);
    const endDate = new Date(assignment.end_date);
    const durationDays = differenceInDays(endDate, startDate) + 1;
    const newEndDate = addDays(newStartDate, durationDays - 1);

    onMove(assignment.id, newStartDate, newEndDate);
    setCurrentLeft(newLeft);
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Handle resize end
  const handleResizeEnd = (e: MouseEvent) => {
    if (!isResizing) return;

    const startDate = new Date(assignment.start_date);
    const endDate = new Date(assignment.end_date);
    const durationDays = differenceInDays(endDate, startDate) + 1;
    const diff = e.clientX - dragStart.x;
    const newDays = Math.max(1, Math.round((durationDays * columnWidth + diff) / columnWidth));
    const newEndDate = addDays(startDate, newDays - 1);

    onResize(assignment.id, newEndDate);
    setCurrentWidth(newDays * columnWidth);
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Handle double click for edit
  const handleDoubleClick = () => {
    onEdit(assignment);
  };

  return (
    <Menu>
      <MenuButton
        as={Box}
        position="absolute"
        left={`${currentLeft}px`}
        width={`${currentWidth}px`}
        height="30px"
        bg="blue.500"
        color="white"
        borderRadius="0" // Set border radius to 0
        cursor="move"
        _hover={{ bg: 'blue.600' }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        data-testid="assignment-block"
        transition="none" // Disable transitions for smoother dragging
      >
        <Text fontSize="sm" px={2} isTruncated>
          {assignment.project_name}
        </Text>
        <Box
          position="absolute"
          right={0}
          top={0}
          bottom={0}
          width="8px"
          cursor="ew-resize"
          onMouseDown={handleResizeStart}
          data-testid="resize-handle"
        />
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => onEdit(assignment)}>Edit</MenuItem>
        <MenuItem onClick={() => onDelete(assignment.id)} color="red.500">
          Delete
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default AssignmentBlock;