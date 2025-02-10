const pool = require('../config/database');

class EmployeeService {
  /**
   * Get all employees
   */
  async getEmployees() {
    const result = await pool.query('SELECT * FROM employees ORDER BY name');
    return result.rows;
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id) {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    return result.rows[0];
  }

  /**
   * Create a new employee
   */
  async createEmployee(data) {
    const result = await pool.query(`
      INSERT INTO employees (
        name, employee_number, entry_date, email, phone,
        position, seniority_level, level_code, qualifications,
        work_time_factor, contract_end_date, status, part_time_factor
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *
    `, [
      data.name,
      data.employee_number,
      data.entry_date,
      data.email,
      data.phone,
      data.position,
      data.seniority_level,
      data.level_code,
      data.qualifications,
      data.work_time_factor,
      data.contract_end_date,
      data.status || 'active',
      data.part_time_factor || 100.00
    ]);
    return result.rows[0];
  }

  /**
   * Update an employee
   */
  async updateEmployee(id, data) {
    const result = await pool.query(`
      UPDATE employees SET
        name = COALESCE($1, name),
        employee_number = COALESCE($2, employee_number),
        entry_date = COALESCE($3, entry_date),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        position = COALESCE($6, position),
        seniority_level = COALESCE($7, seniority_level),
        level_code = COALESCE($8, level_code),
        qualifications = COALESCE($9, qualifications),
        work_time_factor = COALESCE($10, work_time_factor),
        contract_end_date = COALESCE($11, contract_end_date),
        status = COALESCE($12, status),
        part_time_factor = COALESCE($13, part_time_factor),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `, [
      data.name,
      data.employee_number,
      data.entry_date,
      data.email,
      data.phone,
      data.position,
      data.seniority_level,
      data.level_code,
      data.qualifications,
      data.work_time_factor,
      data.contract_end_date,
      data.status,
      data.part_time_factor,
      id
    ]);
    return result.rows[0];
  }

  /**
   * Delete an employee
   */
  async deleteEmployee(id) {
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
  }

  /**
   * Get employee assignments
   */
  async getEmployeeAssignments(id) {
    const result = await pool.query(`
      SELECT pa.*, p.name as project_name, p.project_number
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      WHERE pa.employee_id = $1
      ORDER BY pa.start_date
    `, [id]);
    return result.rows;
  }

  /**
   * Get employee availability
   */
  async getEmployeeAvailability(id, startDate, endDate) {
    const result = await pool.query(`
      WITH RECURSIVE dates AS (
        SELECT $2::date AS date
        UNION ALL
        SELECT date + 1
        FROM dates
        WHERE date < $3::date
      ),
      daily_assignments AS (
        SELECT 
          d.date,
          COALESCE(SUM(pa.allocation_percentage), 0) as workload,
          json_agg(json_build_object(
            'project_id', pa.project_id,
            'allocation', pa.allocation_percentage,
            'role', pa.role
          )) FILTER (WHERE pa.id IS NOT NULL) as assignments
        FROM dates d
        LEFT JOIN project_assignments pa ON 
          pa.employee_id = $1 AND
          pa.status = 'active' AND
          d.date BETWEEN pa.start_date AND pa.end_date
        GROUP BY d.date
      )
      SELECT 
        date::text,
        workload,
        COALESCE(assignments, '[]'::json) as assignments
      FROM daily_assignments
      ORDER BY date
    `, [id, startDate, endDate]);
    return result.rows;
  }
}

module.exports = new EmployeeService();
