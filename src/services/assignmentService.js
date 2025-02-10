import pool from '../config/database.js';
import workloadService from './workloadService.js';

class AssignmentService {
  /**
   * Create a new project assignment with workload validation
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

      // Validate workload
      const workloadValidation = await workloadService.validateAssignment(
        employee_id,
        start_date,
        end_date,
        allocation_percentage
      );

      if (!workloadValidation.valid) {
        throw new Error(workloadValidation.message);
      }

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
          status,
          workload_warning
        ) VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, $8, $9, 'active', $10)
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
          position_status,
          workloadValidation.warning
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
   * Get assignments for a project with workload information
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

    // Enhance with current workload information
    const assignments = result.rows;
    for (const assignment of assignments) {
      const workload = await workloadService.calculateWorkload(
        assignment.employee_id,
        assignment.start_date,
        assignment.end_date
      );
      assignment.totalWorkload = Math.max(...workload.map(w => w.totalWorkload));
    }

    return assignments;
  }

  /**
   * Get assignments for an employee with workload information
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

    // Add workload information
    const assignments = result.rows;
    for (const assignment of assignments) {
      const workload = await workloadService.calculateWorkload(
        employeeId,
        assignment.start_date,
        assignment.end_date
      );
      assignment.totalWorkload = Math.max(...workload.map(w => w.totalWorkload));
    }

    return assignments;
  }

  /**
   * Update an assignment with workload validation
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

      // If allocation or dates changed, validate workload
      if (allocation_percentage || start_date || end_date) {
        const currentAssignment = await this.getAssignmentById(id);
        const workloadValidation = await workloadService.validateAssignment(
          currentAssignment.employee_id,
          start_date || currentAssignment.start_date,
          end_date || currentAssignment.end_date,
          allocation_percentage || currentAssignment.allocation_percentage
        );

        if (!workloadValidation.valid) {
          throw new Error(workloadValidation.message);
        }

        data.workload_warning = workloadValidation.warning;
      }

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
             workload_warning = COALESCE($9, workload_warning),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
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
          data.workload_warning,
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
}

const assignmentService = new AssignmentService();
export default assignmentService;