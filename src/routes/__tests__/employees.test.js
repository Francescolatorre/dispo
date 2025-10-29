const express = require('express');
const request = require('supertest');
const employeesRouter = require('../employees');

// Mock the service
jest.mock('../../services/employeeService');
const employeeService = require('../../services/employeeService');

const app = express();
app.use(express.json());
app.use('/api/employees', employeesRouter);

describe('Employees Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/employees', () => {
    it('should return all employees', async () => {
      const mockEmployees = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ];
      employeeService.getAllEmployees = jest.fn().mockResolvedValue(mockEmployees);

      const response = await request(app)
        .get('/api/employees')
        .expect(200);

      expect(response.body).toEqual(mockEmployees);
      expect(employeeService.getAllEmployees).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      employeeService.getAllEmployees = jest.fn().mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/employees')
        .expect(500);
    });
  });

  describe('GET /api/employees/:id', () => {
    it('should return employee by id', async () => {
      const mockEmployee = { id: 1, name: 'John Doe', email: 'john@example.com' };
      employeeService.getEmployeeById = jest.fn().mockResolvedValue(mockEmployee);

      const response = await request(app)
        .get('/api/employees/1')
        .expect(200);

      expect(response.body).toEqual(mockEmployee);
      expect(employeeService.getEmployeeById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when employee not found', async () => {
      employeeService.getEmployeeById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/employees/999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid id', async () => {
      await request(app)
        .get('/api/employees/invalid')
        .expect(400);
    });
  });

  describe('POST /api/employees', () => {
    it('should create new employee', async () => {
      const newEmployee = {
        name: 'New Employee',
        email: 'new@example.com',
        employee_number: 'EMP001'
      };
      const createdEmployee = { id: 3, ...newEmployee };
      employeeService.createEmployee = jest.fn().mockResolvedValue(createdEmployee);

      const response = await request(app)
        .post('/api/employees')
        .send(newEmployee)
        .expect(201);

      expect(response.body).toEqual(createdEmployee);
      expect(employeeService.createEmployee).toHaveBeenCalledWith(newEmployee);
    });

    it('should handle validation errors', async () => {
      employeeService.createEmployee = jest.fn().mockRejectedValue(new Error('Validation error'));

      await request(app)
        .post('/api/employees')
        .send({ name: 'Test' })
        .expect(500);
    });
  });

  describe('PATCH /api/employees/:id', () => {
    it('should update employee', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedEmployee = { id: 1, name: 'Updated Name', email: 'test@example.com' };
      employeeService.updateEmployee = jest.fn().mockResolvedValue(updatedEmployee);

      const response = await request(app)
        .patch('/api/employees/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedEmployee);
      expect(employeeService.updateEmployee).toHaveBeenCalledWith(1, updateData);
    });

    it('should return 404 when employee not found', async () => {
      employeeService.updateEmployee = jest.fn().mockResolvedValue(null);

      await request(app)
        .patch('/api/employees/999')
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should return 400 for invalid id', async () => {
      await request(app)
        .patch('/api/employees/invalid')
        .send({ name: 'Test' })
        .expect(400);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should delete employee', async () => {
      employeeService.deleteEmployee = jest.fn().mockResolvedValue(true);

      await request(app)
        .delete('/api/employees/1')
        .expect(204);

      expect(employeeService.deleteEmployee).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid id', async () => {
      await request(app)
        .delete('/api/employees/invalid')
        .expect(400);
    });
  });
});
