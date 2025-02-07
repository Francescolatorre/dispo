import { useMemo } from 'react';
import type { AssignmentWithRelations } from '../types/assignment';

interface WorkloadThresholds {
  warning: number;
  error: number;
}

interface WorkloadStatus {
  value: number;
  isWarning: boolean;
  isError: boolean;
  message: string;
}

const defaultThresholds: WorkloadThresholds = {
  warning: 80,
  error: 100,
};

export const useWorkload = (
  assignments: AssignmentWithRelations[],
  thresholds: WorkloadThresholds = defaultThresholds,
  currentAssignmentId?: number
): WorkloadStatus => {
  return useMemo(() => {
    // Filter out current assignment if provided
    const relevantAssignments = currentAssignmentId
      ? assignments.filter(a => a.id !== currentAssignmentId)
      : assignments;

    // Calculate total workload
    const totalWorkload = relevantAssignments.reduce(
      (sum, assignment) => sum + assignment.allocation_percentage,
      0
    );

    // Determine status
    const isError = totalWorkload >= thresholds.error;
    const isWarning = !isError && totalWorkload >= thresholds.warning;

    // Generate appropriate message
    let message = '';
    if (isError) {
      message = `Workload exceeds maximum capacity (${totalWorkload}%)`;
    } else if (isWarning) {
      message = `High workload detected (${totalWorkload}%)`;
    }

    return {
      value: totalWorkload,
      isWarning,
      isError,
      message,
    };
  }, [assignments, thresholds, currentAssignmentId]);
};

interface ValidateWorkloadOptions {
  currentAssignmentId?: number;
  thresholds?: WorkloadThresholds;
}

export const validateWorkload = (
  assignments: AssignmentWithRelations[],
  newAllocation: number,
  options: ValidateWorkloadOptions = {}
): WorkloadStatus => {
  const { currentAssignmentId, thresholds = defaultThresholds } = options;

  // Filter out current assignment if updating
  const relevantAssignments = currentAssignmentId
    ? assignments.filter(a => a.id !== currentAssignmentId)
    : assignments;

  // Calculate total workload including new allocation
  const totalWorkload = relevantAssignments.reduce(
    (sum, assignment) => sum + assignment.allocation_percentage,
    0
  ) + newAllocation;

  // Determine status
  const isError = totalWorkload >= thresholds.error;
  const isWarning = !isError && totalWorkload >= thresholds.warning;

  // Generate message
  let message = '';
  if (isError) {
    message = `Total workload would exceed maximum capacity (${totalWorkload}%)`;
  } else if (isWarning) {
    message = `Assignment would result in high workload (${totalWorkload}%)`;
  }

  return {
    value: totalWorkload,
    isWarning,
    isError,
    message,
  };
};

export const formatWorkload = (value: number): string => {
  return Number(value).toFixed(1).replace(/\.0$/, '');
};

export default useWorkload;