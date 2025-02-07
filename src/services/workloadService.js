const { pool } = require('../config/database');

/**
 * @typedef {Object} DailyWorkload
 * @property {Date} date - The date
 * @property {number} totalWorkload - Total workload percentage for the day
 * @property {Array<{projectId: number, projectName: string, allocation: number}>} assignments - Project assignments for the day
 */

/**
 * Service for handling workload calculations and validations
 */
class WorkloadService {
  /**
   * Calculate employee workload for a given period
   * @param {number} employeeId - Employee ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<DailyWorkload[]>} Array of daily workloads
   */
  async calculateWorkload(employeeId, startDate, endDate) {
    const client = await pool.connect();
    try {
      // Get employee details
      const employeeResult = await client.query(
        'SELECT work_time_factor, part_time_factor FROM employees WHERE id = $1',
        [employeeId]
      );
      
      if (!employeeResult.rows[0]) {
        throw new Error('Employee not found');
      }

      const { work_time_factor, part_time_factor } = employeeResult.rows[0];
      const partTimeFactor = part_time_factor / 100;

      // Get assignments in period
      const assignmentsResult = await client.query(
        `SELECT 
          a.project_id,
          p.name as project_name,
          a.allocation_percentage,
          a.start_date,
          a.end_date
        FROM project_assignments a
        JOIN projects p ON a.project_id = p.id
        WHERE a.employee_id = $1
          AND a.status = 'active'
          AND (a.start_date, a.end_date) OVERLAPS ($2::date, $3::date)`,
        [employeeId, startDate, endDate]
      );

      // Generate all dates in range
      const dates = this.generateDateRange(startDate, endDate);

      // Calculate workload for each date
      return dates.map(date => {
        const dailyAssignments = assignmentsResult.rows.filter(assignment =>
          this.isDateInRange(date, assignment.start_date, assignment.end_date)
        );

        const totalWorkload = dailyAssignments.reduce((sum, assignment) =>
          sum + (assignment.allocation_percentage * work_time_factor * partTimeFactor),
          0
        );

        return {
          date,
          totalWorkload: Math.round(totalWorkload * 100) / 100, // Round to 2 decimal places
          assignments: dailyAssignments.map(a => ({
            projectId: a.project_id,
            projectName: a.project_name,
            allocation: Math.round(a.allocation_percentage * work_time_factor * partTimeFactor * 100) / 100
          }))
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Validate a new assignment's workload
   * @param {number} employeeId - Employee ID
   * @param {Date} startDate - Assignment start date
   * @param {Date} endDate - Assignment end date
   * @param {number} allocation - Allocation percentage
   * @returns {Promise<{valid: boolean, warning: boolean, message?: string}>}
   */
  async validateAssignment(employeeId, startDate, endDate, allocation) {
    // Check allocation steps
    if (allocation % 10 !== 0) {
      return {
        valid: false,
        warning: false,
        message: 'Allocation must be in steps of 10%'
      };
    }

    // Calculate existing workload
    const workload = await this.calculateWorkload(employeeId, startDate, endDate);
    const maxWorkload = Math.max(...workload.map(w => w.totalWorkload));

    // Check total allocation
    if (maxWorkload + allocation > 100) {
      return {
        valid: false,
        warning: false,
        message: `Total workload would exceed 100%: ${maxWorkload + allocation}%`
      };
    }

    // Check for warnings (>80% allocation)
    const warning = maxWorkload + allocation > 80;

    return {
      valid: true,
      warning,
      message: warning ? 'High workload warning (>80%)' : undefined
    };
  }

  /**
   * Generate array of dates between start and end
   * @private
   */
  generateDateRange(start, end) {
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  /**
   * Check if a date falls within a range
   * @private
   */
  isDateInRange(date, start, end) {
    const checkDate = new Date(date).setHours(0, 0, 0, 0);
    const startDate = new Date(start).setHours(0, 0, 0, 0);
    const endDate = new Date(end).setHours(0, 0, 0, 0);
    return checkDate >= startDate && checkDate <= endDate;
  }
}

module.exports = new WorkloadService();