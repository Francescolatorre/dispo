const path = require('path');
const {
  pool,
  setupTestDb,
  teardownTestDb,
  runMigration,
  insertTestData
} = require('./test-config');

describe('Database Migrations', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('Project Requirements Table', () => {
    it('should create project_requirements table', async () => {
      // Check if table exists
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'project_requirements'
        );
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    it('should enforce date validation', async () => {
      // Attempt to insert invalid dates
      await expect(pool.query(`
        INSERT INTO project_requirements (
          project_id,
          role,
          seniority_level,
          start_date,
          end_date
        ) VALUES (
          1,
          'Developer',
          'Senior',
          '2024-02-01',
          '2024-01-01'
        );
      `)).rejects.toThrow();
    });

    it('should enforce foreign key constraint with projects', async () => {
      // Attempt to insert with non-existent project_id
      await expect(pool.query(`
        INSERT INTO project_requirements (
          project_id,
          role,
          seniority_level,
          start_date,
          end_date
        ) VALUES (
          999999,
          'Developer',
          'Senior',
          '2024-01-01',
          '2024-02-01'
        );
      `)).rejects.toThrow();
    });

    it('should enforce valid status values', async () => {
      // Attempt to insert invalid status
      await expect(pool.query(`
        INSERT INTO project_requirements (
          project_id,
          role,
          seniority_level,
          start_date,
          end_date,
          status
        ) VALUES (
          1,
          'Developer',
          'Senior',
          '2024-01-01',
          '2024-02-01',
          'invalid_status'
        );
      `)).rejects.toThrow();
    });
  });

  describe('Project Assignments Table Updates', () => {
    it('should have new columns for requirement tracking', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'project_assignments'
        AND column_name IN ('requirement_id', 'status', 'termination_reason');
      `);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('requirement_id');
      expect(columns).toContain('status');
      expect(columns).toContain('termination_reason');
    });

    it('should enforce foreign key constraint with requirements', async () => {
      // Attempt to insert with non-existent requirement_id
      await expect(pool.query(`
        INSERT INTO project_assignments (
          project_id,
          employee_id,
          requirement_id,
          role,
          start_date,
          end_date,
          allocation_percentage
        ) VALUES (
          1,
          1,
          999999,
          'Developer',
          '2024-01-01',
          '2024-02-01',
          100
        );
      `)).rejects.toThrow();
    });

    it('should enforce valid status values', async () => {
      // Attempt to insert invalid status
      await expect(pool.query(`
        INSERT INTO project_assignments (
          project_id,
          employee_id,
          requirement_id,
          role,
          start_date,
          end_date,
          status,
          allocation_percentage
        ) VALUES (
          1,
          1,
          1,
          'Developer',
          '2024-01-01',
          '2024-02-01',
          'invalid_status',
          100
        );
      `)).rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    let testEmployeeId;
    let testProjectId;

    beforeEach(async () => {
      // Clear any existing test data
      await pool.query('DELETE FROM project_assignments');
      await pool.query('DELETE FROM project_requirements');
      await pool.query('DELETE FROM projects');
      await pool.query('DELETE FROM employees');

      // Insert test employee
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
          'EMP-0001',
          '2024-01-01',
          'test@example.com',
          'Manager',
          'Senior',
          'SR',
          1.0,
          100.0
        ) RETURNING id;
      `);
      testEmployeeId = employeeResult.rows[0].id;

      // Insert test project
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

    it('should allow creating requirement and assignment', async () => {
      // Create requirement
      const reqResult = await pool.query(`
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
          '2024-01-01',
          '2024-12-31'
        ) RETURNING id;
      `, [testProjectId]);
      
      const requirementId = reqResult.rows[0].id;
      
      // Create assignment
      const assignResult = await pool.query(`
        INSERT INTO project_assignments (
          project_id,
          employee_id,
          requirement_id,
          role,
          start_date,
          end_date,
          allocation_percentage
        ) VALUES (
          $1,
          $2,
          $3,
          'Developer',
          '2024-01-01',
          '2024-12-31',
          100
        ) RETURNING *;
      `, [testProjectId, testEmployeeId, requirementId]);
      
      expect(assignResult.rows[0].requirement_id).toBe(requirementId);
    });

    it('should track assignment status changes', async () => {
      // Create requirement and assignment
      const { rows: [req] } = await pool.query(`
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
          '2024-01-01',
          '2024-12-31'
        ) RETURNING id;
      `, [testProjectId]);
      
      const { rows: [assignment] } = await pool.query(`
        INSERT INTO project_assignments (
          project_id,
          employee_id,
          requirement_id,
          role,
          start_date,
          end_date,
          status,
          allocation_percentage
        ) VALUES (
          $1,
          $2,
          $3,
          'Developer',
          '2024-01-01',
          '2024-12-31',
          'active',
          100
        ) RETURNING id;
      `, [testProjectId, testEmployeeId, req.id]);
      
      // Update status to terminated
      await pool.query(`
        UPDATE project_assignments 
        SET status = 'terminated',
            termination_reason = 'Project restructuring'
        WHERE id = $1;
      `, [assignment.id]);
      
      const result = await pool.query(
        'SELECT status, termination_reason FROM project_assignments WHERE id = $1',
        [assignment.id]
      );
      
      expect(result.rows[0].status).toBe('terminated');
      expect(result.rows[0].termination_reason).toBe('Project restructuring');
    });
  });
});