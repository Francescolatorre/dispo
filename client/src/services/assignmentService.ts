import type {
  Assignment,
  AssignmentWithRelations,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  AssignmentValidation,
  AssignmentValidationDto,
  AssignmentFilters,
} from '../types/assignment';

const API_BASE_URL = '/api/assignments';

// Convert camelCase to snake_case
function toSnakeCase(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = value;
    }
  });
  return result;
}

async function getAssignments(filters?: AssignmentFilters): Promise<AssignmentWithRelations[]> {
  const queryParams = new URLSearchParams();
  if (filters) {
    const snakeCaseFilters = toSnakeCase(filters);
    Object.entries(snakeCaseFilters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch assignments');
  }
  return response.json();
}

async function getAssignment(id: number): Promise<AssignmentWithRelations> {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch assignment');
  }
  return response.json();
}

async function createAssignment(data: CreateAssignmentDto): Promise<Assignment> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create assignment');
  }
  return response.json();
}

async function updateAssignment(id: number, data: UpdateAssignmentDto): Promise<Assignment> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update assignment');
  }
  return response.json();
}

async function deleteAssignment(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete assignment');
  }
}

async function validateAssignment(data: AssignmentValidationDto): Promise<AssignmentValidation> {
  const snakeCaseData = toSnakeCase(data);
  const response = await fetch(`${API_BASE_URL}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(snakeCaseData),
  });
  if (!response.ok) {
    throw new Error('Failed to validate assignment');
  }
  return response.json();
}

async function getAssignmentsByProject(projectId: number): Promise<AssignmentWithRelations[]> {
  const response = await fetch(`${API_BASE_URL}/project/${projectId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch project assignments');
  }
  return response.json();
}

async function getAssignmentsByEmployee(employeeId: number): Promise<AssignmentWithRelations[]> {
  const response = await fetch(`${API_BASE_URL}/employee/${employeeId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch employee assignments');
  }
  return response.json();
}

export const assignmentService = {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  validateAssignment,
  getAssignmentsByProject,
  getAssignmentsByEmployee,
  // Alias for backward compatibility
  getProjectAssignments: getAssignmentsByProject,
};