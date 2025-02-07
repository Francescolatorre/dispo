import React from 'react';
import { HStack } from '@chakra-ui/react';
import WorkloadBadge from './WorkloadBadge';
import WorkloadWarning from './WorkloadWarning';
import { useWorkload } from '../../hooks/useWorkload';
import type { AssignmentWithRelations } from '../../types/assignment';

interface WorkloadThresholds {
  warning: number;
  error: number;
}

interface WorkloadIndicatorProps {
  workload: number;
  assignments?: AssignmentWithRelations[];
  thresholds?: WorkloadThresholds;
  currentAssignmentId?: number;
  showWarning?: boolean;
}

const WorkloadIndicator: React.FC<WorkloadIndicatorProps> = ({
  workload,
  assignments = [],
  thresholds,
  currentAssignmentId,
  showWarning = true,
}) => {
  // Use workload hook if assignments are provided
  const workloadStatus = assignments.length > 0
    ? useWorkload(assignments, thresholds, currentAssignmentId)
    : {
        value: workload,
        isWarning: false,
        isError: false,
        message: '',
      };

  return (
    <HStack spacing={2} align="center">
      <WorkloadBadge
        workload={workloadStatus.value}
        thresholds={thresholds}
      />
      {showWarning && (workloadStatus.isWarning || workloadStatus.isError) && (
        <WorkloadWarning
          workload={workloadStatus.value}
          assignments={assignments}
          message={workloadStatus.message}
          type={workloadStatus.isError ? 'error' : 'warning'}
          thresholds={thresholds}
          currentAssignmentId={currentAssignmentId}
        />
      )}
    </HStack>
  );
};

export default WorkloadIndicator;