import axios from 'axios';
import type { Employee, CreateEmployeeDto, UpdateEmployeeDto } from '../types/employee';

const API_BASE_URL = '/api';

class EmployeeService {
  /**
   * Get all employees
   */
  async getEmployees(): Promise<Employee[]> {
    const response = await axios.get(`${API_BASE_URL}/employees`);
    return response.data;
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: number): Promise<Employee> {
    const response = await axios.get(`${API_BASE_URL}/employees/${id}`);
    return response.data;
  }

  /**
   * Create a new employee
   */
  async createEmployee(data: CreateEmployeeDto): Promise<Employee> {
    const response = await axios.post(`${API_BASE_URL}/employees`, data);
    return response.data;
  }

  /**
   * Update an employee
   */
  async updateEmployee(id: number, data: UpdateEmployeeDto): Promise<Employee> {
    const response = await axios.patch(`${API_BASE_URL}/employees/${id}`, data);
    return response.data;
  }

  /**
   * Delete an employee
   */
  async deleteEmployee(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/employees/${id}`);
  }

  /**
   * Get employee assignments
   */
  async getEmployeeAssignments(id: number): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/employees/${id}/assignments`);
    return response.data;
  }

  /**
   * Get employee availability
   */
  async getEmployeeAvailability(
    id: number,
    startDate: string,
    endDate: string
  ): Promise<{
    date: string;
    workload: number;
    assignments: any[];
  }[]> {
    const response = await axios.get(
      `${API_BASE_URL}/employees/${id}/availability?start_date=${startDate}&end_date=${endDate}`
    );
    return response.data;
  }
}

export const employeeService = new EmployeeService();
