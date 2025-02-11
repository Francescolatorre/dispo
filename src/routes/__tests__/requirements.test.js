import request from 'supertest';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import app from '../../server.js';
import { setupTestDb, cleanTestDb, createTestTransaction, createTestDataFactory } from './setup.js';
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

describe('Requirement Routes', () => {
  let testProject;
  let testEmployee;
  let testRequirement;
  let testDataFactory;
  let client;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    // Start a transaction for test isolation
    client = await createTestTransaction();
    testDataFactory = createTestDataFactory(client);

    // Create test data
    testEmployee = await testDataFactory.createEmployee({
      position: 'Project Manager',
      seniority_level: 'senior'
    });

    testProject = await testDataFactory.createProject({
      project_manager_id: testEmployee.id
    });

    testRequirement = await testDataFactory.createRequirement({
      project_id: testProject.id
    });

    // Clear mock calls
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Rollback transaction
    await client.query('ROLLBACK');
    await client.release();
  });

  describe('GET /api/requirements', () => {
    it('should list requirements with pagination', async () => {
      const response = await request(app)
        .get('/api/requirements')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requirements');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.requirements)).toBe(true);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Fetching requirements list',
        expect.any(Object)
      );
    });

    it('should filter requirements by project', async () => {
      const response = await request(app)
        .get('/api/requirements')
        .query({ projectId: testProject.id });

      expect(response.status).toBe(200);
      expect(response.body.requirements.every(r => r.project_id === testProject.id)).toBe(true);
    });

    it('should filter requirements by status', async () => {
      const response = await request(app)
        .get('/api/requirements')
        .query({ status: 'open' });

      expect(response.status).toBe(200);
      expect(response.body.requirements.every(r => r.status === 'open')).toBe(true);
    });
  });

  describe('GET /api/requirements/:id', () => {
    it('should get requirement by ID', async () => {
      const response = await request(app)
        .get(`/api/requirements/${testRequirement.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testRequirement.id);
      expect(response.body).toHaveProperty('role', testRequirement.role);
      expect(response.body).toHaveProperty('project_id', testRequirement.project_id);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Fetching requirement by ID',
        expect.any(Object)
      );
    });

    it('should handle non-existent requirement', async () => {
      const response = await request(app)
        .get('/api/requirements/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Requirement with id 999999 not found');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Requirement not found',
        expect.any(Object)
      );
    });
  });

  describe('POST /api/requirements', () => {
    it('should create new requirement with valid data', async () => {
      const newRequirement = {
        project_id: testProject.id,
        role: 'Backend Developer',
        seniority_level: 'Mid',
        required_qualifications: ['Python', 'Django'],
        start_date: '2025-03-01',
        end_date: '2025-08-31',
        status: 'open',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/requirements')
        .send(newRequirement);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('role', newRequirement.role);
      expect(response.body).toHaveProperty('project_id', newRequirement.project_id);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Creating new requirement',
        expect.any(Object)
      );
    });

    it('should validate required fields', async () => {
      const invalidRequirement = {
        role: 'Backend Developer'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/requirements')
        .send(invalidRequirement);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Requirement validation failed',
        expect.any(Object)
      );
    });

    it('should validate date range', async () => {
      const invalidRequirement = {
        project_id: testProject.id,
        role: 'Backend Developer',
        seniority_level: 'Mid',
        start_date: '2025-12-31',
        end_date: '2025-01-01' // End date before start date
      };

      const response = await request(app)
        .post('/api/requirements')
        .send(invalidRequirement);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'end_date must be after start_date');
    });
  });

  describe('PUT /api/requirements/:id', () => {
    it('should update requirement with valid data', async () => {
      const updateData = {
        role: 'Senior Backend Developer',
        seniority_level: 'Senior',
        priority: 'critical'
      };

      const response = await request(app)
        .put(`/api/requirements/${testRequirement.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('role', updateData.role);
      expect(response.body).toHaveProperty('seniority_level', updateData.seniority_level);
      expect(response.body).toHaveProperty('priority', updateData.priority);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Updating requirement',
        expect.any(Object)
      );
    });

    it('should handle non-existent requirement update', async () => {
      const response = await request(app)
        .put('/api/requirements/999999')
        .send({ role: 'Updated Role' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Requirement with id 999999 not found');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Requirement not found for update',
        expect.any(Object)
      );
    });
  });

  describe('PUT /api/requirements/:id/status', () => {
    it('should update requirement status', async () => {
      const response = await request(app)
        .put(`/api/requirements/${testRequirement.id}/status`)
        .send({
          status: 'filled',
          assignmentId: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'filled');
      expect(response.body).toHaveProperty('current_assignment_id', 1);

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'Updating requirement status',
        expect.any(Object)
      );
    });

    it('should validate status value', async () => {
      const response = await request(app)
        .put(`/api/requirements/${testRequirement.id}/status`)
        .send({
          status: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');

      // Verify logging
      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid status update',
        expect.any(Object)
      );
    });
  });

  describe('DELETE /api/requirements/:id', () => {
    it('should delete requirement', async () => {
      const response = await request(app)
        .delete(`/api/requirements/${testRequirement.id}`);

      expect(response.status).toBe(204);

      // Verify logging
