import { beforeEach, afterAll, describe, it, expect } from '@jest/globals';
import { pool } from '../../config/database.js';
import * as projectService from '../projectService.js';

describe('Project Service', () => {
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

  describe('getActiveProjects', () => {
    it('should return active projects', async () => {
      const projects = await projectService.getActiveProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0]).toHaveProperty('name', 'Test Project');
      expect(projects[0]).toHaveProperty('status', 'active');
    });
  });

  describe('getArchivedProjects', () => {
    it('should return archived projects', async () => {
      await pool.query(
        'UPDATE projects SET status = $1 WHERE id = $2',
        ['archived', testProject.id]
      );

      const projects = await projectService.getArchivedProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0]).toHaveProperty('status', 'archived');
    });
  });

  describe('getProjectById', () => {
    it('should return project by ID', async () => {
      const project = await projectService.getProjectById(testProject.id);
      expect(project).toHaveProperty('name', 'Test Project');
      expect(project).toHaveProperty('project_manager_id', testManager.id);
    });

    it('should return undefined for non-existent project', async () => {
      const project = await projectService.getProjectById(999999);
      expect(project).toBeUndefined();
    });
  });

  describe('createProject', () => {
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

      const project = await projectService.createProject(newProject);
      expect(project).toHaveProperty('name', 'New Project');
      expect(project).toHaveProperty('status', 'active');
      expect(project).toHaveProperty('project_number');
      expect(project.project_number).toMatch(/^P\d+$/);
    });
  });

  describe('updateProject', () => {
    it('should update project', async () => {
      const updates = {
        name: 'Updated Project',
        start_date: testProject.start_date,
        end_date: testProject.end_date,
        project_manager_id: testManager.id,
        documentation_links: ['http://docs.updated.com'],
        status: 'active',
        project_number: testProject.project_number,
        location: 'Munich',
        fte_count: 3
      };

      const project = await projectService.updateProject(testProject.id, updates);
      expect(project).toHaveProperty('name', 'Updated Project');
      expect(project).toHaveProperty('location', 'Munich');
      expect(project).toHaveProperty('fte_count', 3);
    });

    it('should return undefined for non-existent project', async () => {
      const project = await projectService.updateProject(999999, {
        name: 'Updated Project',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        project_manager_id: testManager.id,
        documentation_links: [],
        status: 'active'
      });
      expect(project).toBeUndefined();
    });
  });

  describe('archiveProject', () => {
    it('should archive project', async () => {
      const project = await projectService.archiveProject(testProject.id);
      expect(project).toHaveProperty('status', 'archived');
    });

    it('should return undefined for non-existent project', async () => {
      const project = await projectService.archiveProject(999999);
      expect(project).toBeUndefined();
    });
  });

  describe('deleteProject', () => {
    it('should delete project', async () => {
      const project = await projectService.deleteProject(testProject.id);
      expect(project).toHaveProperty('id', testProject.id);

      const checkResult = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [testProject.id]
      );
      expect(checkResult.rows).toHaveLength(0);
    });

    it('should return undefined for non-existent project', async () => {
      const project = await projectService.deleteProject(999999);
      expect(project).toBeUndefined();
    });
  });

  describe('getProjectAssignments', () => {
    it('should return project assignments with employee details', async () => {
      // Create test assignment
      await pool.query(
        `INSERT INTO project_assignments (
          project_id, employee_id, allocation_percentage,
          start_date, end_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          testProject.id,
          testManager.id,
          50,
          '2024-01-01',
          '2024-12-31',
          'active'
        ]
      );

      const assignments = await projectService.getProjectAssignments(testProject.id);
      expect(assignments).toHaveLength(1);
      expect(assignments[0]).toHaveProperty('employee_name', 'Test Manager');
      expect(assignments[0]).toHaveProperty('position', 'Project Manager');
      expect(assignments[0]).toHaveProperty('allocation_percentage', 50);
    });
  });

  describe('getProjectWorkload', () => {
    it('should return project workload summary', async () => {
      // Create test assignment
      await pool.query(
        `INSERT INTO project_assignments (
          project_id, employee_id, allocation_percentage,
          start_date, end_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          testProject.id,
          testManager.id,
          50,
          '2024-01-01',
          '2024-12-31',
          'active'
        ]
      );

      const workload = await projectService.getProjectWorkload(testProject.id);
      expect(workload).toHaveProperty('total_allocation', '50');
      expect(workload).toHaveProperty('assigned_employees', '1');
      expect(workload).toHaveProperty('required_fte', 2);
    });

    it('should return zero values for project without assignments', async () => {
      const workload = await projectService.getProjectWorkload(testProject.id);
      expect(workload).toEqual({
        total_allocation: 0,
        assigned_employees: 0,
        required_fte: 0
      });
    });
  });
});