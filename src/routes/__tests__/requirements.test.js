const request = require('supertest');
const express = require('express');
const { pool } = require('../../config/database');
const requirementsRouter = require('../requirements');

const app = express();
app.use(express.json());
app.use('/api/requirements', requirementsRouter);

describe('Requirements API', () => {
  let testEmployeeId;
  let testProjectId;
  let testRequirementId;

  beforeAll(async () => {
    // Create test employee with matching qualifications
    const employeeResult = await pool.query(`
      INSERT INTO employees (
        name,
        employee_number,
        entry_date,
        email,
        position,
        seniority_level,
        level_code,
        work_time_factor,
        part_time_factor,
        qualifications
      ) VALUES (
        'Test Employee',
        get_test_employee_number(),
        '2024-01-01',
        'test@example.com',
        'Developer',
        'Senior',
        'SR',
        1.0,
        100.0,
        ARRAY['JavaScript', 'React']
      ) RETURNING id;
    `);
    testEmployeeId = employeeResult.rows[0].id;

    // Create test project
    const projectResult = await pool.query(`
      INSERT INTO projects (
        name,
        project_number,
        start_date,
        end_date,
        location,
        project_manager_id,
        fte_count
      ) VALUES (
        'Test Project',
        'TEST-001',
        '2024-01-01',
        '2024-12-31',
        'Berlin',
        $1,
        1
      ) RETURNING id;
    `, [testEmployeeId]);
    testProjectId = projectResult.rows[0].id;

    // Create a test requirement for tests that need one
    const requirementResult = await pool.query(`
      INSERT INTO project_requirements (
        project_id,
        role,
        seniority_level,
        required_qualifications,
        start_date,
        end_date,
        priority
      ) VALUES (
        $1,
        'Developer',
        'Senior',
        ARRAY['JavaScript', 'React'],
        '2024-02-01',
        '2024-06-30',
        'high'
      ) RETURNING id;
    `, [testProjectId]);
    testRequirementId = requirementResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data in correct order
    try {
      // Delete all assignments first
      await pool.query('DELETE FROM project_assignments');
      // Then delete all requirements
      await pool.query('DELETE FROM project_requirements');
      // Then delete all projects
      await pool.query('DELETE FROM projects');
      // Finally delete all employees
      await pool.query('DELETE FROM employees');
    } finally {
      await pool.end();
    }
  });

  describe('POST /api/requirements', () => {
    it('should create a new requirement', async () => {
      const requirementData = {
        project_id: testProjectId,
        role: 'Developer',
        seniority_level: 'Senior',
        required_qualifications: ['JavaScript', 'React'],
        start_date: '2024-02-01',
        end_date: '2024-06-30',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/requirements')
        .send(requirementData)
        .expect(201);

      expect(response.body).toMatchObject({
        project_id: testProjectId,
        role: 'Developer',
        seniority_level: 'Senior'
      });
    });

    it('should validate requirement data', async () => {
      const invalidData = {
        project_id: testProjectId,
        // Missing required fields
        start_date: '2024-02-01',
        end_date: '2024-06-30'
      };

      await request(app)
        .post('/api/requirements')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/requirements/project/:projectId', () => {
    it('should list requirements for a project', async () => {
      const response = await request(app)
        .get(`/api/requirements/project/${testProjectId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/requirements/:id', () => {
    it('should get requirement details', async () => {
      const response = await request(app)
        .get(`/api/requirements/${testRequirementId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testRequirementId,
        role: 'Developer',
        seniority_level: 'Senior'
      });
    });

    it('should handle non-existent requirement', async () => {
      await request(app)
        .get('/api/requirements/999999')
        .expect(404);
    });
  });

  describe('PUT /api/requirements/:id', () => {
    it('should update requirement details', async () => {
      const updateData = {
        role: 'Senior Developer',
        priority: 'critical'
      };

      const response = await request(app)
        .put(`/api/requirements/${testRequirementId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testRequirementId,
        role: 'Senior Developer',
        priority: 'critical'
      });
    });
  });

  describe('GET /api/requirements/:id/coverage', () => {
    it('should get requirement coverage analysis', async () => {
      const response = await request(app)
        .get(`/api/requirements/${testRequirementId}/coverage`)
        .expect(200);

      expect(response.body).toHaveProperty('periods');
      expect(Array.isArray(response.body.periods)).toBe(true);
    });
  });

  describe('GET /api/requirements/:id/matching-employees', () => {
    it('should find matching employees', async () => {
      const response = await request(app)
        .get(`/api/requirements/${testRequirementId}/matching-employees`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('seniority_level');
    });
  });

  describe('DELETE /api/requirements/:id', () => {
    it('should delete a requirement', async () => {
      await request(app)
        .delete(`/api/requirements/${testRequirementId}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/requirements/${testRequirementId}`)
        .expect(404);
    });
  });
});