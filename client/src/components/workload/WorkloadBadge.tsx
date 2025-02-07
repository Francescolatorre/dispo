import React from 'react';
import {
  Badge,
  Tooltip,
  BadgeProps,
} from '@chakra-ui/react';
import { formatWorkload } from '../../hooks/useWorkload';
import type { AssignmentWithRelations } from '../../types/assignment';

interface WorkloadThresholds {
  warning: number;
  error: number;
}

interface WorkloadBadgeProps {
  workload: number;
  assignments?: AssignmentWithRelations[];
  thresholds?: WorkloadThresholds;
}

const defaultThresholds: WorkloadThresholds = {
  warning: 80,
  error: 100,
};

const WorkloadBadge: React.FC<WorkloadBadgeProps> = ({
  workload,
  thresholds = defaultThresholds,
}) => {
  // Determine badge color based on workload and thresholds
  const getColorScheme = (): BadgeProps['colorScheme'] => {
    if (workload >= thresholds.error) return 'red';
    if (workload >= thresholds.warning) return 'yellow';
    return 'green';
  };

  // Get status for data attribute and ARIA
  const getStatus = (): 'success' | 'warning' | 'error' => {
    if (workload >= thresholds.error) return 'error';
    if (workload >= thresholds.warning) return 'warning';
    return 'success';
  };

  // Format workload percentage
  const formattedWorkload = formatWorkload(workload);

  // Get descriptive message for tooltip
  const getMessage = (): string => {
    if (workload >= thresholds.error) {
      return `Critical: Workload at ${formattedWorkload}%`;
    }
    if (workload >= thresholds.warning) {
      return `Warning: High workload at ${formattedWorkload}%`;
    }
    return `Current workload: ${formattedWorkload}%`;
  };

  return (
    <Tooltip
      label={getMessage()}
      aria-label={`Current workload is ${formattedWorkload} percent`}
      hasArrow
    >
      <Badge
        key="workload-badge"
        colorScheme={getColorScheme()}
        data-status={getStatus()}
        role="status"
        aria-label={`Current workload is ${formattedWorkload} percent`}
        px={2}
        borderRadius="full"
        variant="subtle"
        fontSize="sm"
      >
        {formattedWorkload}%
      </Badge>
    </Tooltip>
  );
};

export default WorkloadBadge;