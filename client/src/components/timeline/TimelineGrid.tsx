import React from 'react';
import {
  Box,
  Grid,
  GridItem,
  Text,
  useTheme,
} from '@chakra-ui/react';
import {
  startOfDay,
  isWeekend,
  isSameDay,
  format,
  isValid,
  isBefore,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInDays,
  addDays,
  endOfDay,
  endOfYear,
  startOfYear,
  getDate,
  getMonth,
} from 'date-fns';

interface TimelineGridProps {
  startDate: Date;
  endDate: Date;
  scale: 'day' | 'week' | 'month';
  children?: React.ReactNode;
}

const TimelineGrid: React.FC<TimelineGridProps> = ({
  startDate,
  endDate,
  scale,
  children,
}) => {
  const theme = useTheme();
  const today = startOfDay(new Date());

  // Validate dates
  if (!isValid(startDate) || !isValid(endDate)) {
    return (
      <Box p={4} color="red.500" data-testid="error-message">
        Invalid date range
      </Box>
    );
  }

  if (isBefore(endDate, startDate)) {
    return (
      <Box p={4} color="red.500" data-testid="error-message">
        Invalid date range
      </Box>
    );
  }

  // Generate time intervals based on scale
  const getTimePoints = () => {
    // Only use full year if we're explicitly viewing the full year
    const isFullYear = scale === 'day' && 
      getDate(startDate) === 1 && getMonth(startDate) === 0 && // January 1st
      getDate(endDate) === 31 && getMonth(endDate) === 11 && // December 31st
      startDate.getFullYear() === endDate.getFullYear();

    const start = isFullYear ? startOfYear(startDate) : startOfDay(startDate);
    const end = isFullYear ? endOfYear(endDate) : endOfDay(endDate);

    const interval = { start, end };

    switch (scale) {
      case 'day':
        return eachDayOfInterval(interval);
      case 'week':
        return eachWeekOfInterval(interval);
      case 'month':
        return eachMonthOfInterval(interval);
      default:
        return [];
    }
  };

  const timePoints = getTimePoints();

  // Calculate column width based on scale
  const columnWidth = {
    day: 40,
    week: 200,
    month: 240,
  }[scale];

  // Format date for column header
  const getColumnHeader = (date: Date) => {
    switch (scale) {
      case 'day':
        return format(date, 'd');
      case 'week':
        return `W${format(date, 'w')}`;
      case 'month':
        return format(date, 'MMM');
      default:
        return '';
    }
  };

  // Calculate total width
  const totalWidth = timePoints.length * columnWidth;

  return (
    <Box
      overflowX="auto"
      position="relative"
      data-testid="timeline-grid"
      role="grid"
      aria-label="Timeline Grid"
    >
      {/* Column Headers */}
      <Grid
        templateColumns={`repeat(${timePoints.length}, ${columnWidth}px)`}
        position="sticky"
        top={0}
        bg="white"
        zIndex={1}
        borderBottom="1px"
        borderColor="gray.200"
      >
        {timePoints.map((date, index) => (
          <GridItem
            key={`header-${date.toISOString()}`}
            role="columnheader"
            p={2}
            textAlign="center"
            borderRight="1px"
            borderColor="gray.200"
          >
            <Text 
              fontSize="sm" 
              color="gray.600"
              data-testid={scale === 'day' ? 'day-label' : `${scale}-label`}
            >
              {getColumnHeader(date)}
            </Text>
          </GridItem>
        ))}
      </Grid>

      {/* Grid Columns */}
      <Grid
        templateColumns={`repeat(${timePoints.length}, ${columnWidth}px)`}
        position="relative"
        minHeight="200px"
        width={`${totalWidth}px`}
      >
        {timePoints.map((date, index) => {
          const isWeekendColumn = scale === 'day' && isWeekend(date);
          const isMonthBoundary = index > 0 && scale === 'day' && date.getDate() === 1;

          return (
            <GridItem
              key={`grid-${date.toISOString()}`}
              borderRight="1px"
              borderColor="gray.200"
              height="100%"
              data-testid="grid-column"
              {...(isWeekendColumn && {
                bg: 'gray.50',
                'data-weekend': 'true',
              })}
              {...(isMonthBoundary && {
                borderLeft: '2px',
                borderLeftColor: 'blue.200',
              })}
            />
          );
        })}

        {/* Weekend Columns (separate elements for testing) */}
        {scale === 'day' && timePoints.map((date, index) => (
          isWeekend(date) && (
            <Box
              key={`weekend-${date.toISOString()}`}
              position="absolute"
              top={0}
              bottom={0}
              left={`${index * columnWidth}px`}
              width={`${columnWidth}px`}
              data-testid="weekend-column"
              pointerEvents="none"
            />
          )
        ))}

        {/* Month Boundaries */}
        {scale === 'day' && timePoints.map((date, index) => (
          index > 0 && date.getDate() === 1 && (
            <Box
              key={`month-boundary-${format(date, 'yyyy-MM')}`}
              position="absolute"
              top={0}
              bottom={0}
              left={`${index * columnWidth}px`}
              width="2px"
              bg="blue.200"
              data-testid={`month-boundary-${format(date, 'yyyy-MM')}`}
              zIndex={1}
            />
          )
        ))}

        {/* Today Marker */}
        {scale === 'day' && timePoints.some(date => isSameDay(date, today)) && (
          <Box
            position="absolute"
            top={0}
            bottom={0}
            left={`${timePoints.findIndex(date => isSameDay(date, today)) * columnWidth}px`}
            width="2px"
            bg="blue.500"
            data-testid="today-marker"
            zIndex={1}
          />
        )}

        {/* Render children (assignment blocks, etc.) */}
        {children}
      </Grid>
    </Box>
  );
};

export default TimelineGrid;