const { pool } = require('../config/database');

class RequirementService {
  /**
   * Create a new project requirement
   */
  async createRequirement(data) {
    const {
      project_id,
      role,
      seniority_level,
      required_qualifications,
      start_date,
      end_date,
      priority,
      notes
    } = data;

    const result = await pool.query(
      `INSERT INTO project_requirements (
        project_id,
        role,
        seniority_level,
        required_qualifications,
        start_date,
        end_date,
        priority,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        project_id,
        role,
        seniority_level,
        required_qualifications || [],
        start_date,
        end_date,
        priority || 'medium',
        notes
      ]
    );

    return result.rows[0];
  }

  /**
   * Get requirement by ID with related data
   */
  async getRequirementById(id) {
    const result = await pool.query(
      `SELECT r.*, 
              p.name as project_name,
              a.id as current_assignment_id,
              a.employee_id as current_employee_id,
              e.name as current_employee_name
       FROM project_requirements r
       LEFT JOIN projects p ON r.project_id = p.id
       LEFT JOIN project_assignments a ON 
         a.requirement_id = r.id AND 
         a.status = 'active' AND
         CURRENT_DATE BETWEEN a.start_date AND a.end_date
       LEFT JOIN employees e ON a.employee_id = e.id
       WHERE r.id = $1`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Get requirements for a project
   */
  async getProjectRequirements(projectId) {
    const result = await pool.query(
      `SELECT r.*, 
              a.id as current_assignment_id,
              a.employee_id as current_employee_id,
              e.name as current_employee_name
       FROM project_requirements r
       LEFT JOIN project_assignments a ON 
         a.requirement_id = r.id AND 
         a.status = 'active' AND
         CURRENT_DATE BETWEEN a.start_date AND a.end_date
       LEFT JOIN employees e ON a.employee_id = e.id
       WHERE r.project_id = $1
       ORDER BY r.start_date`,
      [projectId]
    );

    return result.rows;
  }

  /**
   * Update a requirement
   */
  async updateRequirement(id, data) {
    const {
      role,
      seniority_level,
      required_qualifications,
      start_date,
      end_date,
      status,
      priority,
      notes
    } = data;

    const result = await pool.query(
      `UPDATE project_requirements
       SET role = COALESCE($1, role),
           seniority_level = COALESCE($2, seniority_level),
           required_qualifications = COALESCE($3, required_qualifications),
           start_date = COALESCE($4, start_date),
           end_date = COALESCE($5, end_date),
           status = COALESCE($6, status),
           priority = COALESCE($7, priority),
           notes = COALESCE($8, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        role,
        seniority_level,
        required_qualifications,
        start_date,
        end_date,
        status,
        priority,
        notes,
        id
      ]
    );

    return result.rows[0];
  }

  /**
   * Delete a requirement
   */
  async deleteRequirement(id) {
    await pool.query(
      'DELETE FROM project_requirements WHERE id = $1',
      [id]
    );
  }

  /**
   * Get coverage gaps for a requirement
   */
  async getRequirementCoverage(id) {
    const result = await pool.query(
      `WITH requirement_period AS (
        SELECT 
          id,
          start_date as req_start,
          end_date as req_end
        FROM project_requirements
        WHERE id = $1
      ),
      assignments AS (
        SELECT 
          start_date as assign_start,
          end_date as assign_end
        FROM project_assignments
        WHERE requirement_id = $1
        AND status = 'active'
      )
      SELECT 
        req_start,
        req_end,
        ARRAY_AGG(
          CASE 
            WHEN assign_start IS NULL THEN jsonb_build_object(
              'start', req_start,
              'end', req_end,
              'type', 'gap'
            )
            ELSE jsonb_build_object(
              'start', assign_start,
              'end', assign_end,
              'type', 'covered'
            )
          END
        ) as periods
      FROM requirement_period
      LEFT JOIN assignments ON true
      GROUP BY req_start, req_end`,
      [id]
    );

    return result.rows[0];
  }

  /**
   * Find matching employees for a requirement
   */
  async findMatchingEmployees(requirementId) {
    const result = await pool.query(
      `WITH requirement AS (
        SELECT 
          seniority_level,
          required_qualifications,
          start_date,
          end_date
        FROM project_requirements
        WHERE id = $1
      )
      SELECT 
        e.*,
        COUNT(pa.id) as current_assignments
      FROM employees e
      CROSS JOIN requirement r
      LEFT JOIN project_assignments pa ON 
        e.id = pa.employee_id AND
        pa.status = 'active' AND
        (pa.start_date, pa.end_date) OVERLAPS (r.start_date, r.end_date)
      WHERE 
        e.status = 'active' AND
        e.seniority_level = r.seniority_level AND
        e.qualifications && r.required_qualifications
      GROUP BY e.id
      ORDER BY 
        current_assignments ASC,
        e.seniority_level DESC`,
      [requirementId]
    );

    return result.rows;
  }
}

module.exports = new RequirementService();