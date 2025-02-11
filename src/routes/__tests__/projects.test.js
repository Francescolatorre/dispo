import request from 'supertest';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import app from '../../server.js';
import { setupTestDb } from './setup.js';
import { ProjectRepository } from '../../repositories/project.repository.js';
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

describe('Project Routes', () => {
  let projectRepository;
  let employeeRepository;
  let testProject;
  let testEmployee;
  let testCount = 0;

  const getUniqueProjectNumber = () => `PRJ${testCount}`;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    testCount++;
    projectRepository = new ProjectRepository();
    employeeRepository = new EmployeeRepository();

    // Create test employee (project manager)
    testEmployee = await employeeRepository.createEmployee({
      name: 'Test Manager',
      employee_number: `EMP${testCount}`,
      entry_date: '2025-01-01',
      email: `manager${testCount}@example.com`,
      phone: '+1234567890',
      position: 'Project Manager',
      seniority_level: 'senior',
      level_code: 'S3',
      qualifications: ['Project Management'],
      work_time_factor: 1,
      status: 'active'
    });

    // Create test project
    testProject = await projectRepository.createProject({
      name: 'Test Project',
      project_number: getUniqueProjectNumber(),
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      location: 'Test Location',
      project_manager_id: testEmployee.id,
      documentation_links: ['https://example.com/docs'],
      status: 'active'
    });

    // Clear mock calls
    vi.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should list projects with pagination', async () => {
      const response = await request(app)
        .get('/api/projects')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.projects)).toBe(true);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Fetching projects list',
        expect.any(Object)
      );
    });

    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/projects')
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.projects.every(p => p.status === 'active')).toBe(true);
    });

    it('should filter projects by manager', async () => {
      const response = await request(app)
        .get('/api/projects')
        .query({ managerId: testEmployee.id });

      expect(response.status).toBe(200);
      expect(response.body.projects.every(p => p.project_manager_id === testEmployee.id)).toBe(true);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should get project by ID', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testProject.id);
      expect(response.body).toHaveProperty('name', testProject.name);
      expect(response.body).toHaveProperty('project_number', testProject.project_number);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Fetching project by ID',
        expect.any(Object)
      );
    });

    it('should handle non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project with id 999999 not found');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Project not found',
        expect.any(Object)
      );
    });
  });

  describe('POST /api/projects', () => {
    it('should create new project with valid data', async () => {
      const newProject = {
        name: 'New Project',
        project_number: getUniqueProjectNumber(),
        start_date: '2025-02-01',
        end_date: '2025-12-31',
        location: 'New Location',
        project_manager_id: testEmployee.id,
        documentation_links: ['https://example.com/new-docs'],
        status: 'active'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(newProject);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newProject.name);
      expect(response.body).toHaveProperty('project_number', newProject.project_number);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Creating new project',
        expect.any(Object)
      );
    });

    it('should reject duplicate project number', async () => {
      const duplicateProject = {
        name: 'Duplicate Project',
        project_number: testProject.project_number,
        start_date: '2025-02-01',
        end_date: '2025-12-31',
        location: 'New Location',
        project_manager_id: testEmployee.id
      };

      const response = await request(app)
        .post('/api/projects')
        .send(duplicateProject);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Project number already exists');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Project creation conflict',
        expect.any(Object)
      );
    });

    it('should validate required fields', async () => {
      const invalidProject = {
        name: 'Invalid Project'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidProject);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Project validation failed',
        expect.any(Object)
      );
    });

    it('should validate date range', async () => {
      const invalidProject = {
        name: 'Invalid Project',
        project_number: getUniqueProjectNumber(),
        start_date: '2025-12-31',
        end_date: '2025-01-01', // End date before start date
        location: 'Test Location',
        project_manager_id: testEmployee.id
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidProject);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'end_date must be after start_date');
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project with valid data', async () => {
      const updateData = {
        name: 'Updated Project',
        location: 'Updated Location',
        project_manager_id: testEmployee.id
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('location', updateData.location);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Updating project',
        expect.any(Object)
      );
    });

    it('should handle non-existent project update', async () => {
      const response = await request(app)
        .put('/api/projects/999999')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project with id 999999 not found');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Project not found for update',
        expect.any(Object)
      );
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProject.id}`);

      expect(response.status).toBe(204);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Deleting project',
        expect.any(Object)
      );

      // Verify project was deleted
      const getResponse = await request(app)
        .get(`/api/projects/${testProject.id}`);
      expect(getResponse.status).toBe(404);
    });

    it('should prevent deletion of project with assignments', async () => {
      // Create a project assignment
      await projectRepository.executeQuery(
        'INSERT INTO project_assignments (project_id, employee_id, start_date, end_date, allocation) VALUES ($1, $2, $3, $4, $5)',
        [testProject.id, testEmployee.id, '2025-01-01', '2025-12-31', 1]
      );

      const response = await request(app)
        .delete(`/api/projects/${testProject.id}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cannot delete project with existing assignments');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Cannot delete project with assignments',
        expect.any(Object)
      );
    });
  });

  describe('GET /api/projects/:id/assignments', () => {
    it('should get project assignments', async () => {
      // Create a project assignment
      await projectRepository.executeQuery(
        'INSERT INTO project_assignments (project_id, employee_id, start_date, end_date, allocation) VALUES ($1, $2, $3, $4, $5)',
        [testProject.id, testEmployee.id, '2025-01-01', '2025-12-31', 1]
      );

      const response = await request(app)
        .get(`/api/projects/${testProject.id}/assignments`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('project_id', testProject.id);
      expect(response.body[0]).toHaveProperty('employee_id', testEmployee.id);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Fetching project assignments',
        expect.any(Object)
      );
    });

    it('should handle non-existent project assignments', async () => {
      const response = await request(app)
        .get('/api/projects/999999/assignments');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Project with id 999999 not found');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Project not found',
        expect.any(Object)
      );
    });
  });
});