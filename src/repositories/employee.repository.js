import { BaseRepository } from './base.repository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';

/**
 * Repository for managing employee data in the database
 */
export class EmployeeRepository extends BaseRepository {
  constructor(client = null) {
    super('employees');
    this.client = client;
  }

  /**
   * Get SQL for creating employees table
   * @returns {string} Table creation SQL
   */
  getSchemaSQL() {
    return `
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        employee_number VARCHAR(20) UNIQUE NOT NULL,
        entry_date DATE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        position VARCHAR(100) NOT NULL,
        seniority_level VARCHAR(50) NOT NULL,
        level_code VARCHAR(10) NOT NULL,
        qualifications TEXT[] NOT NULL DEFAULT '{}',
        work_time_factor DECIMAL(3,2) NOT NULL CHECK (work_time_factor > 0 AND work_time_factor <= 1),
        contract_end_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        part_time_factor DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (part_time_factor BETWEEN 0.00 AND 100.00),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }

  /**
   * Get SQL for additional schema elements (triggers, indexes, etc.)
   * @returns {string} Additional schema SQL
   */
  getAdditionalSchemaSQL() {
    return `
      -- Create updated_at trigger function if it doesn't exist
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger for updated_at
      DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
      CREATE TRIGGER update_employees_updated_at
        BEFORE UPDATE ON employees
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Create sequence for employee numbers if it doesn't exist
      CREATE SEQUENCE IF NOT EXISTS employee_number_seq;
    `;
  }

  /**
   * Create a new employee
   * @param {Object} employeeData Employee data to insert
   * @returns {Promise<Object>} Created employee object
   */
  async createEmployee(employeeData) {
    try {
      const result = await this.executeQuery(
        `INSERT INTO employees (
          name,
          employee_number,
          entry_date,
          email,
          phone,
          position,
          seniority_level,
          level_code,
          qualifications,
          work_time_factor,
          contract_end_date,
          status,
          part_time_factor
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        Object.values(employeeData)
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'employees_email_key') {
          throw new ConflictError('Employee', 'email', employeeData.email);
        }
        if (error.constraint === 'employees_employee_number_key') {
          throw new ConflictError('Employee', 'employee_number', employeeData.employee_number);
        }
      }
      throw error;
    }
  }

  /**
   * Find an employee by their ID
   * @param {number} id Employee's ID
   * @returns {Promise<Object>} Employee object
   */
  async findById(id) {
    const result = await this.executeQuery(
      'SELECT * FROM employees WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('Employee', id);
    }

    return result.rows[0];
  }

  /**
   * Update employee data
   * @param {number} id Employee's ID
   * @param {Object} updateData Data to update
   * @returns {Promise<Object>} Updated employee object
   */
  async updateEmployee(id, updateData) {
    const allowedUpdates = [
      'name',
      'entry_date',
      'email',
      'phone',
      'position',
      'seniority_level',
      'level_code',
      'qualifications',
      'work_time_factor',
      'contract_end_date',
      'status',
      'part_time_factor'
    ];

    const updates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key) && updateData[key] !== undefined);

    if (updates.length === 0) {
      return this.findById(id);
    }

    const setClause = updates
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values = updates.map(key => updateData[key]);

    try {
      const result = await this.executeQuery(
        `UPDATE employees SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
      );

      if (!result.rows[0]) {
        throw new NotFoundError('Employee', id);
      }

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'employees_email_key') {
          throw new ConflictError('Employee', 'email', updateData.email);
        }
        if (error.constraint === 'employees_employee_number_key') {
          throw new ConflictError('Employee', 'employee_number', updateData.employee_number);
        }
      }
      throw error;
    }
  }

  /**
   * Delete an employee
   * @param {number} id Employee's ID
   * @returns {Promise<void>}
   */
  async deleteEmployee(id) {
    const result = await this.executeQuery(
      'DELETE FROM employees WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('Employee', id);
    }
  }

  /**
   * List employees with pagination
   * @param {Object} options Pagination options
   * @param {number} options.limit Maximum number of employees to return
   * @param {number} options.offset Number of employees to skip
   * @returns {Promise<Object>} Object containing employees and count
   */
  async listEmployees({ limit = 10, offset = 0 } = {}) {
    const countResult = await this.executeQuery('SELECT COUNT(*) FROM employees');
    const totalCount = parseInt(countResult.rows[0].count);

    const employees = await this.executeQuery(
      'SELECT * FROM employees ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return {
      employees: employees.rows,
      totalCount,
      hasMore: totalCount > offset + limit
    };
  }
}