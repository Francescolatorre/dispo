const { pool } = require('../../config/database');
const requirementService = require('../requirementService');

describe('RequirementService', () => {
  let testEmployeeId;
  let testProjectId;

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
        part_time_factor
      ) VALUES (
        'Test Employee',
        'EMP-TEST',
        '2024-01-01',
        'test@example.com',
        'Developer',
        'Senior',
        'SR',
        1.0,
        100.0
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
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM project_assignments');
    await pool.query('DELETE FROM project_requirements');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM employees');
    await pool.end();
  });

  describe('createRequirement', () => {
    it('should create a requirement successfully', async () => {
      const requirementData = {
        project_id: testProjectId,
        role: 'Developer',
        seniority_level: 'Senior',
        required_qualifications: ['JavaScript', 'React'],
        start_date: '2024-02-01',
        end_date: '2024-06-30',
        priority: 'high'
      };

      const requirement = await requirementService.createRequirement(requirementData);

      expect(requirement).toMatchObject({
        project_id: testProjectId,
        role: 'Developer',
        seniority_level: 'Senior',
        status: 'open'
      });
      expect(requirement.required_qualifications).toEqual(['JavaScript', 'React']);
    });
  });

  describe('getRequirementById', () => {
    it('should retrieve a requirement with project details', async () => {
      // Create a requirement first
      const { rows: [requirement] } = await pool.query(`
        INSERT INTO project_requirements (
          project_id,
          role,
          seniority_level,
          start_date,
          end_date
        ) VALUES ($1, 'Developer', 'Senior', '2024-02-01', '2024-06-30')
        RETURNING id
      `, [testProjectId]);

      const result = await requirementService.getRequirementById(requirement.id);

      expect(result).toMatchObject({
        role: 'Developer',
        seniority_level: 'Senior',
        project_name: 'Test Project'
      });
    });
  });

  describe('getProjectRequirements', () => {
    it('should list all requirements for a project', async () => {
      const requirements = await requirementService.getProjectRequirements(testProjectId);
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
    });
  });

  describe('updateRequirement', () => {
    it('should update requirement details', async () => {
      // Create a requirement first
      const { rows: [requirement] } = await pool.query(`
        INSERT INTO project_requirements (
          project_id,
          role,
          seniority_level,
          start_date,
          end_date
        ) VALUES ($1, 'Developer', 'Senior', '2024-02-01', '2024-06-30')
        RETURNING id
      `, [testProjectId]);

      const updateData = {
        role: 'Senior Developer',
        priority: 'critical'
      };

      const updated = await requirementService.updateRequirement(
        requirement.id,
        updateData
      );

      expect(updated).toMatchObject({
        role: 'Senior Developer',
        priority: 'critical'
      });
    });
  });

  describe('findMatchingEmployees', () => {
    it('should find employees matching requirement criteria', async () => {
      // Create a requirement
      const { rows: [requirement] } = await pool.query(`
        INSERT INTO project_requirements (
          project_id,
          role,
          seniority_level,
          required_qualifications,
          start_date,
          end_date
        ) VALUES (
          $1,
          'Developer',
          'Senior',
          ARRAY['JavaScript', 'React'],
          '2024-02-01',
          '2024-06-30'
        )
        RETURNING id
      `, [testProjectId]);

      const matches = await requirementService.findMatchingEmployees(requirement.id);
      expect(Array.isArray(matches)).toBe(true);
    });
  });

  describe('getRequirementCoverage', () => {
    it('should analyze coverage periods', async () => {
      // Create a requirement
      const { rows: [requirement] } = await pool.query(`
        INSERT INTO project_requirements (
          project_id,
          role,
          seniority_level,
          start_date,
          end_date
        ) VALUES (
          $1,
          'Developer',
          'Senior',
          '2024-02-01',
          '2024-06-30'
        )
        RETURNING id
      `, [testProjectId]);

      const coverage = await requirementService.getRequirementCoverage(requirement.id);
      expect(coverage).toHaveProperty('periods');
      expect(Array.isArray(coverage.periods)).toBe(true);
    });
  });
});