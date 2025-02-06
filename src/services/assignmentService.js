const { pool } = require('../config/database');

class AssignmentService {
  /**
   * Create a new project assignment
   */
  async createAssignment(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        project_id,
        employee_id,
        requirement_id,
        role,
        start_date,
        end_date,
        allocation_percentage,
        dr_status,
        position_status
      } = data;

      // Create the assignment
      const result = await client.query(
        `INSERT INTO project_assignments (
          project_id,
          employee_id,
          requirement_id,
          role,
          start_date,
          end_date,
          allocation_percentage,
          dr_status,
          position_status,
          status
        ) VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, $8, $9, 'active')
        RETURNING *`,
        [
          project_id,
          employee_id,
          requirement_id,
          role,
          start_date,
          end_date,
          allocation_percentage,
          dr_status,
          position_status
        ]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get assignment by ID with related data
   */
  async getAssignmentById(id) {
    const result = await pool.query(
      `SELECT a.*,
              p.name as project_name,
              e.name as employee_name,
              r.role as requirement_role,
              r.seniority_level as requirement_seniority_level
       FROM project_assignments a
       LEFT JOIN projects p ON a.project_id = p.id
       LEFT JOIN employees e ON a.employee_id = e.id
       LEFT JOIN project_requirements r ON a.requirement_id = r.id
       WHERE a.id = $1`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Get assignments for a project
   */
  async getProjectAssignments(projectId) {
    const result = await pool.query(
      `SELECT a.*,
              e.name as employee_name,
              e.seniority_level as employee_seniority_level,
              r.role as requirement_role
       FROM project_assignments a
       LEFT JOIN employees e ON a.employee_id = e.id
       LEFT JOIN project_requirements r ON a.requirement_id = r.id
       WHERE a.project_id = $1
       ORDER BY a.start_date`,
      [projectId]
    );

    return result.rows;
  }

  /**
   * Get assignments for an employee
   */
  async getEmployeeAssignments(employeeId) {
    const result = await pool.query(
      `SELECT a.*,
              p.name as project_name,
              r.role as requirement_role,
              r.seniority_level as requirement_seniority_level
       FROM project_assignments a
       LEFT JOIN projects p ON a.project_id = p.id
       LEFT JOIN project_requirements r ON a.requirement_id = r.id
       WHERE a.employee_id = $1
       ORDER BY a.start_date`,
      [employeeId]
    );

    return result.rows;
  }

  /**
   * Update an assignment
   */
  async updateAssignment(id, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        role,
        start_date,
        end_date,
        allocation_percentage,
        dr_status,
        position_status,
        status,
        termination_reason
      } = data;

      const result = await client.query(
        `UPDATE project_assignments
         SET role = COALESCE($1, role),
             start_date = COALESCE($2::date, start_date),
             end_date = COALESCE($3::date, end_date),
             allocation_percentage = COALESCE($4, allocation_percentage),
             dr_status = COALESCE($5, dr_status),
             position_status = COALESCE($6, position_status),
             status = COALESCE($7, status),
             termination_reason = COALESCE($8, termination_reason),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $9
         RETURNING *`,
        [
          role,
          start_date,
          end_date,
          allocation_percentage,
          dr_status,
          position_status,
          status,
          termination_reason,
          id
        ]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Terminate an assignment
   */
  async terminateAssignment(id, reason) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE project_assignments
         SET status = 'terminated',
             termination_reason = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [reason, id]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get assignment history for a requirement
   */
  async getRequirementHistory(requirementId) {
    const result = await pool.query(
      `SELECT a.*,
              e.name as employee_name,
              e.seniority_level as employee_seniority_level
       FROM project_assignments a
       LEFT JOIN employees e ON a.employee_id = e.id
       WHERE a.requirement_id = $1
       ORDER BY a.start_date DESC`,
      [requirementId]
    );

    return result.rows;
  }

  /**
   * Check employee availability for a given period
   */
  async checkEmployeeAvailability(employeeId, startDate, endDate) {
    const result = await pool.query(
      `SELECT 
         a.id,
         a.project_id,
         p.name as project_name,
         a.start_date::text,
         a.end_date::text,
         a.allocation_percentage
       FROM project_assignments a
       JOIN projects p ON a.project_id = p.id
       WHERE a.employee_id = $1
         AND a.status = 'active'
         AND (a.start_date::date, a.end_date::date) OVERLAPS ($2::date, $3::date)
       ORDER BY a.start_date`,
      [employeeId, startDate, endDate]
    );

    return result.rows;
  }
}

module.exports = new AssignmentService();