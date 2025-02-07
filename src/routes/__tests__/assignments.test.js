const request = require('supertest');
const express = require('express');
const { pool } = require('../../config/database');
const assignmentsRouter = require('../assignments');

const app = express();
app.use(express.json());
app.use('/api/assignments', assignmentsRouter);

describe('Assignments API', () => {
  let testEmployeeId;
  let testProjectId;
  let testRequirementId;
  let testAssignmentId;

  beforeAll(async () => {
    // Create test employee
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
        get_test_email(),
        'Developer',
        'Senior',
        'SR',
        1.0,
        100.0,
        ARRAY['JavaScript', 'React']
      ) RETURNING id;
    `);
    testEmployeeId = employeeResult.rows[0].id;

    // Create test project with unique project number
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
        'TEST-' || nextval('test_employee_number_seq'),
        '2024-01-01',
        '2024-12-31',
        'Berlin',
        $1,
        1
      ) RETURNING id;
    `, [testEmployeeId]);
    testProjectId = projectResult.rows[0].id;

    // Create test requirement
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

    // Create initial test assignment
    const assignmentResult = await pool.query(`
      INSERT INTO project_assignments (
        project_id,
        employee_id,
        requirement_id,
        role,
        start_date,
        end_date,
        allocation_percentage,
        status
      ) VALUES (
        $1,
        $2,
        $3,
        'Developer',
        '2024-02-01',
        '2024-06-30',
        50,
        'active'
      ) RETURNING id;
    `, [testProjectId, testEmployeeId, testRequirementId]);
    testAssignmentId = assignmentResult.rows[0].id;
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

  describe('POST /api/assignments', () => {
    it('should create a new assignment', async () => {
      const assignmentData = {
        project_id: testProjectId,
        employee_id: testEmployeeId,
        requirement_id: testRequirementId,
        role: 'Developer',
        start_date: '2024-02-01',
        end_date: '2024-06-30',
        allocation_percentage: 50
      };

      const response = await request(app)
        .post('/api/assignments')
        .send(assignmentData)
        .expect(201);

      expect(response.body).toMatchObject({
        project_id: testProjectId,
        employee_id: testEmployeeId,
        requirement_id: testRequirementId,
        status: 'active'
      });
    });

    it('should validate assignment data', async () => {
      const invalidData = {
        project_id: testProjectId,
        // Missing required fields
        start_date: '2024-02-01',
        end_date: '2024-06-30'
      };

      const response = await request(app)
        .post('/api/assignments')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should check employee availability', async () => {
      const conflictingData = {
        project_id: testProjectId,
        employee_id: testEmployeeId,
        requirement_id: testRequirementId,
        role: 'Developer',
        start_date: '2024-02-01',
        end_date: '2024-06-30',
        allocation_percentage: 60 // Would exceed 100% with existing assignment
      };

      const response = await request(app)
        .post('/api/assignments')
        .send(conflictingData)
        .expect(400);

      expect(response.body.errors).toContain('Total allocation percentage exceeds 100% for the given period');
    });
  });

  describe('GET /api/assignments/project/:projectId', () => {
    it('should list assignments for a project', async () => {
      const response = await request(app)
        .get(`/api/assignments/project/${testProjectId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/assignments/employee/:employeeId', () => {
    it('should list assignments for an employee', async () => {
      const response = await request(app)
        .get(`/api/assignments/employee/${testEmployeeId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/assignments/:id', () => {
    it('should get assignment details', async () => {
      const response = await request(app)
        .get(`/api/assignments/${testAssignmentId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testAssignmentId,
        role: 'Developer',
        status: 'active'
      });
    });
  });

  describe('POST /api/assignments/:id/terminate', () => {
    it('should terminate an assignment', async () => {
      const response = await request(app)
        .post(`/api/assignments/${testAssignmentId}/terminate`)
        .send({ reason: 'Project restructuring' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: testAssignmentId,
        status: 'terminated',
        termination_reason: 'Project restructuring'
      });
    });

    it('should require termination reason', async () => {
      await request(app)
        .post(`/api/assignments/${testAssignmentId}/terminate`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/assignments/requirement/:requirementId/history', () => {
    it('should get assignment history for a requirement', async () => {
      const response = await request(app)
        .get(`/api/assignments/requirement/${testRequirementId}/history`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/assignments/check-availability/:employeeId', () => {
    it('should check employee availability', async () => {
      const response = await request(app)
        .get(`/api/assignments/check-availability/${testEmployeeId}`)
        .query({
          start_date: '2024-02-01',
          end_date: '2024-06-30'
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should require date parameters', async () => {
      await request(app)
        .get(`/api/assignments/check-availability/${testEmployeeId}`)
        .expect(400);
    });
  });
});