import request from 'supertest';
import { beforeEach, afterAll, describe, it, expect } from '@jest/globals';
import { pool } from '../../config/database.js';
import app from '../../server.js';

describe('Project Routes', () => {
  let testProject;
  let testManager;

  beforeEach(async () => {
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM employees WHERE email = $1', ['manager@test.com']);

    // Create test manager
    const managerResult = await pool.query(
      `INSERT INTO employees (
        name, employee_number, entry_date, email, position, 
        seniority_level, level_code, work_time_factor, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        'Test Manager',
        'EMP001',
        '2024-01-01',
        'manager@test.com',
        'Project Manager',
        'Senior',
        'SEN',
        1.0,
        'active'
      ]
    );
    testManager = managerResult.rows[0];

    // Create test project
    const projectResult = await pool.query(
      `INSERT INTO projects (
        name, project_number, start_date, end_date, location,
        fte_count, project_manager_id, documentation_links, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        'Test Project',
        'P123',
        '2024-01-01',
        '2024-12-31',
        'Berlin',
        2,
        testManager.id,
        ['http://docs.test.com'],
        'active'
      ]
    );
    testProject = projectResult.rows[0];
  });

  afterAll(async () => {
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM employees WHERE email = $1', ['manager@test.com']);
    await pool.end();
  });

  describe('GET /projects', () => {
    it('should return active projects', async () => {
      const response = await request(app).get('/api/projects');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('name', 'Test Project');
    });

    it('should return archived projects', async () => {
      await pool.query(
        'UPDATE projects SET status = $1 WHERE id = $2',
        ['archived', testProject.id]
      );

      const response = await request(app).get('/api/projects/archived');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('name', 'Test Project');
      expect(response.body[0]).toHaveProperty('status', 'archived');
    });
  });

  describe('GET /projects/:id', () => {
    it('should return project by ID', async () => {
      const response = await request(app).get(`/api/projects/${testProject.id}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app).get('/api/projects/999999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /projects', () => {
    it('should create new project', async () => {
      const newProject = {
        name: 'New Project',
        start_date: '2024-02-01',
        end_date: '2024-12-31',
        project_manager_id: testManager.id,
        documentation_links: ['http://docs.new.com'],
        location: 'Munich',
        fte_count: 3
      };

      const response = await request(app)
        .post('/api/projects')
        .send(newProject);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'New Project');
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContain('Name must be at least 2 characters long');
    });
  });

  describe('PUT /projects/:id', () => {
    it('should update project', async () => {
      const updates = {
        name: 'Updated Project',
        start_date: testProject.start_date,
        end_date: testProject.end_date,
        project_manager_id: testManager.id,
        documentation_links: ['http://docs.updated.com'],
        status: 'active'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Project');
      expect(response.body).toHaveProperty('documentation_links')
      expect(response.body.documentation_links).toContain('http://docs.updated.com');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .put('/api/projects/999999')
        .send({
          name: 'Updated Project',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          project_manager_id: testManager.id,
          documentation_links: [],
          status: 'active'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /projects/:id/archive', () => {
    it('should archive project', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProject.id}/archive`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'archived');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .post('/api/projects/999999/archive');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProject.id}`);

      expect(response.status).toBe(204);

      // Verify project is deleted
      const checkResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [testProject.id]
      );
      expect(checkResult.rows.length).toBe(0);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete('/api/projects/999999');

      expect(response.status).toBe(404);
    });
  });
});