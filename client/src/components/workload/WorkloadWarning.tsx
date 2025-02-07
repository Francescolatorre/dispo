import React from 'react';
import {
  Icon,
  Tooltip,
  Text,
  VStack,
  Box,
} from '@chakra-ui/react';
import { WarningIcon, WarningTwoIcon } from '@chakra-ui/icons';
import { validateWorkload } from '../../hooks/useWorkload';
import type { AssignmentWithRelations } from '../../types/assignment';

interface WorkloadThresholds {
  warning: number;
  error: number;
}

interface WarningMessage {
  title: string;
  description: string;
}

interface WorkloadWarningProps {
  workload: number;
  assignments?: AssignmentWithRelations[];
  message?: string | WarningMessage;
  type?: 'warning' | 'error';
  thresholds?: WorkloadThresholds;
  currentAssignmentId?: number;
}

const defaultThresholds: WorkloadThresholds = {
  warning: 80,
  error: 100,
};

const WorkloadWarning: React.FC<WorkloadWarningProps> = ({
  workload,
  assignments = [],
  message,
  type,
  thresholds = defaultThresholds,
  currentAssignmentId,
}) => {
  // Validate workload if assignments are provided
  const validation = assignments.length > 0
    ? validateWorkload(assignments, workload, {
        currentAssignmentId,
        thresholds,
      })
    : {
        value: workload,
        isWarning: workload >= thresholds.warning && workload < thresholds.error,
        isError: workload >= thresholds.error,
        message: '',
      };

  // Determine if warning should be shown
  const shouldShow = (): boolean => {
    if (type === 'error') return validation.isError;
    if (type === 'warning') return validation.isWarning;
    return validation.isWarning || validation.isError;
  };

  // Get icon and color based on type or validation
  const getIconProps = () => {
    const isError = type === 'error' || validation.isError;
    return {
      as: isError ? WarningTwoIcon : WarningIcon,
      color: isError ? 'red.500' : 'yellow.500',
      'data-testid': isError ? 'error-icon' : 'warning-icon',
    };
  };

  // Don't render if no warning needed
  if (!shouldShow()) return null;

  // Use provided message or validation message
  const warningMessage = message || validation.message;

  // Format message content
  const messageContent = typeof warningMessage === 'string' ? (
    <Text>{warningMessage}</Text>
  ) : (
    <VStack align="start" spacing={1}>
      <Text fontWeight="bold">{warningMessage.title}</Text>
      <Text fontSize="sm">{warningMessage.description}</Text>
    </VStack>
  );

  const ariaLabel = typeof warningMessage === 'string' 
    ? warningMessage 
    : warningMessage.title;

  return (
    <Tooltip
      label={messageContent}
      hasArrow
      placement="top"
    >
      <Box
        display="inline-block"
        role="alert"
        aria-label={ariaLabel}
        tabIndex={0}
        sx={{
          ':focus-visible': {
            outline: '2px solid var(--chakra-colors-blue-500)',
            outlineOffset: '2px',
          }
        }}
      >
        <Icon
          {...getIconProps()}
          boxSize={4}
          cursor="help"
          transition="color 0.2s"
          _hover={{
            color: validation.isError ? 'red.600' : 'yellow.600',
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default WorkloadWarning;