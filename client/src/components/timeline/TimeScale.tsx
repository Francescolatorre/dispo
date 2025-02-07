import React from 'react';
import {
  Box,
  Select,
  IconButton,
  Tooltip,
  HStack,
  Text,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
} from 'date-fns';

interface TimeScaleProps {
  startDate: Date;
  endDate: Date;
  scale: 'day' | 'week' | 'month';
  onScaleChange: (scale: 'day' | 'week' | 'month') => void;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

const TimeScale: React.FC<TimeScaleProps> = ({
  startDate,
  endDate,
  scale,
  onScaleChange,
  onDateRangeChange,
}) => {
  const handlePrevMonth = () => {
    const newStart = startOfMonth(subMonths(startDate, 1));
    const newEnd = endOfMonth(subMonths(endDate, 1));
    onDateRangeChange(newStart, newEnd);
  };

  const handleNextMonth = () => {
    const newStart = startOfMonth(addMonths(startDate, 1));
    const newEnd = endOfMonth(addMonths(endDate, 1));
    onDateRangeChange(newStart, newEnd);
  };

  const handleScaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onScaleChange(event.target.value as 'day' | 'week' | 'month');
  };

  return (
    <Box p={4} borderBottom="1px" borderColor="gray.200">
      <HStack spacing={4} justify="space-between">
        <HStack spacing={2}>
          <Tooltip label="Previous month" hasArrow>
            <IconButton
              aria-label="Previous month"
              icon={<ChevronLeftIcon />}
              onClick={handlePrevMonth}
              data-testid="prev-button"
            />
          </Tooltip>
          <Text fontSize="lg" fontWeight="medium">
            {format(startDate, 'MMMM yyyy')}
          </Text>
          <Tooltip label="Next month" hasArrow>
            <IconButton
              aria-label="Next month"
              icon={<ChevronRightIcon />}
              onClick={handleNextMonth}
              data-testid="next-button"
            />
          </Tooltip>
        </HStack>
        <Select
          value={scale}
          onChange={handleScaleChange}
          width="auto"
          data-testid="scale-select"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </Select>
      </HStack>
    </Box>
  );
};

export default TimeScale;