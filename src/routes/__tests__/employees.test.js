import request from 'supertest';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import app from '../../server.js';
import { setupTestDb } from './setup.js';
import { EmployeeRepository } from '../../repositories/employee.repository.js';
import { logger } from '../../utils/logger.js';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('Employee Routes', () => {
  let employeeRepository;
  let testEmployee;
  let testCount = 0;

  const getUniqueEmployeeNumber = () => `EMP${testCount}`;
  const getUniqueEmail = () => `employee${testCount}@example.com`;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    testCount++;
    employeeRepository = new EmployeeRepository();

    // Create test employee
    testEmployee = await employeeRepository.createEmployee({
      name: 'Test Employee',
      employee_number: getUniqueEmployeeNumber(),
      entry_date: '2025-01-01',
      email: getUniqueEmail(),
      phone: '+1234567890',
      position: 'Software Engineer',
      seniority_level: 'senior',
      level_code: 'S3',
      qualifications: ['JavaScript', 'Node.js'],
      work_time_factor: 1,
      status: 'active'
    });

    // Clear mock calls
    vi.clearAllMocks();
  });

  describe('GET /api/employees', () => {
    it('should list employees with pagination', async () => {
      const response = await request(app)
        .get('/api/employees')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('employees');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.employees)).toBe(true);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Fetching employees list',
        expect.any(Object)
      );
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/employees')
        .query({ limit: 'invalid', offset: 'invalid' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');

      // Verify error logging
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('GET /api/employees/:id', () => {
    it('should get employee by ID', async () => {
      const response = await request(app)
        .get(`/api/employees/${testEmployee.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testEmployee.id);
      expect(response.body).toHaveProperty('name', testEmployee.name);
      expect(response.body).toHaveProperty('email', testEmployee.email);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Fetching employee by ID',
        expect.any(Object)
      );
    });

    it('should handle non-existent employee', async () => {
      const response = await request(app)
        .get('/api/employees/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Employee with id 999999 not found');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Employee not found',
        expect.any(Object)
      );
    });
  });

  describe('POST /api/employees', () => {
    it('should create new employee with valid data', async () => {
      const newEmployee = {
        name: 'New Employee',
        employee_number: getUniqueEmployeeNumber(),
        entry_date: '2025-01-01',
        email: getUniqueEmail(),
        phone: '+1234567890',
        position: 'Software Engineer',
        seniority_level: 'mid',
        level_code: 'M2',
        qualifications: ['Python', 'Django'],
        work_time_factor: 1,
        status: 'active'
      };

      const response = await request(app)
        .post('/api/employees')
        .send(newEmployee);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newEmployee.name);
      expect(response.body).toHaveProperty('email', newEmployee.email);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Creating new employee',
        expect.any(Object)
      );
    });

    it('should reject duplicate employee number', async () => {
      const duplicateEmployee = {
        name: 'Duplicate Employee',
        employee_number: testEmployee.employee_number,
        entry_date: '2025-01-01',
        email: getUniqueEmail(),
        phone: '+1234567890',
        position: 'Software Engineer',
        seniority_level: 'junior',
        level_code: 'J1',
        qualifications: ['Java', 'Spring'],
        work_time_factor: 1,
        status: 'active'
      };

      const response = await request(app)
        .post('/api/employees')
        .send(duplicateEmployee);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Employee number already exists');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Employee creation conflict',
        expect.any(Object)
      );
    });

    it('should validate required fields', async () => {
      const invalidEmployee = {
        name: 'Invalid Employee'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/employees')
        .send(invalidEmployee);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Employee validation failed',
        expect.any(Object)
      );
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('should update employee with valid data', async () => {
      const updateData = {
        name: 'Updated Name',
        position: 'Senior Software Engineer',
        seniority_level: 'senior',
        work_time_factor: 0.8
      };

      const response = await request(app)
        .put(`/api/employees/${testEmployee.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('position', updateData.position);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Updating employee',
        expect.any(Object)
      );
    });

    it('should handle non-existent employee update', async () => {
      const response = await request(app)
        .put('/api/employees/999999')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Employee with id 999999 not found');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Employee not found for update',
        expect.any(Object)
      );
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should delete employee', async () => {
      const response = await request(app)
        .delete(`/api/employees/${testEmployee.id}`);

      expect(response.status).toBe(204);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Deleting employee',
        expect.any(Object)
      );

      // Verify employee was deleted
      const getResponse = await request(app)
        .get(`/api/employees/${testEmployee.id}`);
      expect(getResponse.status).toBe(404);
    });

    it('should handle non-existent employee deletion', async () => {
      const response = await request(app)
        .delete('/api/employees/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Employee with id 999999 not found');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Employee not found for deletion',
        expect.any(Object)
      );
    });

    it('should prevent deletion of employee with assignments', async () => {
      // Create a project assignment for the test employee
      await employeeRepository.executeQuery(
        'INSERT INTO project_assignments (employee_id, project_id, start_date, end_date, allocation) VALUES ($1, $2, $3, $4, $5)',
        [testEmployee.id, 1, '2025-01-01', '2025-12-31', 1]
      );

      const response = await request(app)
        .delete(`/api/employees/${testEmployee.id}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cannot delete employee with existing project assignments');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Cannot delete employee with assignments',
        expect.any(Object)
      );
    });
  });
});