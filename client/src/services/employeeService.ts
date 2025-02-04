import { Employee } from '../types/employee';

const API_URL = 'http://localhost:3000/api';

export const employeeService = {
  getAll: async (): Promise<Employee[]> => {
    const response = await fetch(`${API_URL}/employees`);
    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }
    return response.json();
  },

  getById: async (id: number): Promise<Employee> => {
    const response = await fetch(`${API_URL}/employees/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch employee');
    }
    return response.json();
  },

  create: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> => {
    const response = await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    });
    if (!response.ok) {
      throw new Error('Failed to create employee');
    }
    return response.json();
  },

  update: async (id: number, employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> => {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    });
    if (!response.ok) {
      throw new Error('Failed to update employee');
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete employee');
    }
  },
};
