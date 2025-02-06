const { pool } = require('../../config/database');
const assignmentService = require('../assignmentService');

describe('AssignmentService', () => {
  let testEmployeeId;
  let testProjectId;
  let testRequirementId;

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

    // Create test requirement
    const requirementResult = await pool.query(`
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
      ) RETURNING id;
    `, [testProjectId]);
    testRequirementId = requirementResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM project_assignments');
    await pool.query('DELETE FROM project_requirements');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM employees');
    await pool.end();
  });

  describe('createAssignment', () => {
    it('should create an assignment successfully', async () => {
      const assignmentData = {
        project_id: testProjectId,
        employee_id: testEmployeeId,
        requirement_id: testRequirementId,
        role: 'Developer',
        start_date: '2024-02-01',
        end_date: '2024-06-30',
        allocation_percentage: 100,
        dr_status: 'primary',
        position_status: 'confirmed'
      };

      const assignment = await assignmentService.createAssignment(assignmentData);

      expect(assignment).toMatchObject({
        project_id: testProjectId,
        employee_id: testEmployeeId,
        requirement_id: testRequirementId,
        role: 'Developer',
        status: 'active'
      });
    });
  });

  describe('getAssignmentById', () => {
    it('should retrieve an assignment with related details', async () => {
      // Create an assignment first
      const { rows: [assignment] } = await pool.query(`
        INSERT INTO project_assignments (
          project_id,
          employee_id,
          requirement_id,
          role,
          start_date,
          end_date,
          allocation_percentage
        ) VALUES (
          $1, $2, $3, 'Developer', '2024-02-01', '2024-06-30', 100
        ) RETURNING id
      `, [testProjectId, testEmployeeId, testRequirementId]);

      const result = await assignmentService.getAssignmentById(assignment.id);

      expect(result).toMatchObject({
        role: 'Developer',
        project_name: 'Test Project',
        employee_name: 'Test Employee'
      });
    });
  });

  describe('getProjectAssignments', () => {
    it('should list all assignments for a project', async () => {
      const assignments = await assignmentService.getProjectAssignments(testProjectId);
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBeGreaterThan(0);
    });
  });

  describe('getEmployeeAssignments', () => {
    it('should list all assignments for an employee', async () => {
      const assignments = await assignmentService.getEmployeeAssignments(testEmployeeId);
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBeGreaterThan(0);
    });
  });

  describe('terminateAssignment', () => {
    it('should terminate an assignment with reason', async () => {
      // Create an assignment first
      const { rows: [assignment] } = await pool.query(`
        INSERT INTO project_assignments (
          project_id,
          employee_id,
          requirement_id,
          role,
          start_date,
          end_date,
          allocation_percentage
        ) VALUES (
          $1, $2, $3, 'Developer', '2024-02-01', '2024-06-30', 100
        ) RETURNING id
      `, [testProjectId, testEmployeeId, testRequirementId]);

      const terminated = await assignmentService.terminateAssignment(
        assignment.id,
        'Project restructuring'
      );

      expect(terminated).toMatchObject({
        status: 'terminated',
        termination_reason: 'Project restructuring'
      });
    });
  });

  describe('checkEmployeeAvailability', () => {
    it('should check employee availability for a period', async () => {
      const availability = await assignmentService.checkEmployeeAvailability(
        testEmployeeId,
        '2024-07-01',
        '2024-12-31'
      );

      expect(Array.isArray(availability)).toBe(true);
      // Should be available since test assignments end in June
      expect(availability.length).toBe(0);
    });

    it('should detect conflicts in availability', async () => {
      const availability = await assignmentService.checkEmployeeAvailability(
        testEmployeeId,
        '2024-02-01',
        '2024-06-30'
      );

      expect(Array.isArray(availability)).toBe(true);
      // Should have conflicts with test assignments
      expect(availability.length).toBeGreaterThan(0);
    });
  });

  describe('getRequirementHistory', () => {
    it('should track assignment history for a requirement', async () => {
      const history = await assignmentService.getRequirementHistory(testRequirementId);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });
});