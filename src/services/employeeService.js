import { EmployeeRepository } from '../repositories/employee.repository.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../errors/index.js';

export class EmployeeService {
  constructor(employeeRepository = new EmployeeRepository()) {
    this.employeeRepository = employeeRepository;
  }

  /**
   * Create a new employee
   * @param {Object} employeeData Employee data
   * @returns {Promise<Object>} Created employee
   */
  async createEmployee(employeeData) {
    logger.info('Creating new employee', {
      context: {
        employeeNumber: employeeData.employee_number,
        email: employeeData.email,
        service: 'EmployeeService',
        operation: 'createEmployee'
      }
    });

    try {
      return await this.employeeRepository.withTransaction(async () => {
        const employee = await this.employeeRepository.createEmployee(employeeData);

        logger.info('Employee created successfully', {
          context: {
            employeeId: employee.id,
            employeeNumber: employee.employee_number,
            email: employee.email
          }
        });

        return employee;
      });
    } catch (error) {
      logger.error('Failed to create employee', {
        error,
        context: {
          employeeNumber: employeeData.employee_number,
          email: employeeData.email,
          service: 'EmployeeService',
          operation: 'createEmployee'
        }
      });
      throw error;
    }
  }

  /**
   * Get employee by ID
   * @param {string} id Employee ID
   * @returns {Promise<Object>} Employee object
   */
  async getEmployeeById(id) {
    logger.info('Fetching employee by ID', {
      context: {
        employeeId: id,
        service: 'EmployeeService',
        operation: 'getEmployeeById'
      }
    });

    try {
      const employee = await this.employeeRepository.findById(id);

      logger.debug('Employee found', {
        context: {
          employeeId: id,
          employeeNumber: employee.employee_number
        }
      });

      return employee;
    } catch (error) {
      logger.error('Failed to fetch employee', {
        error,
        context: {
          employeeId: id,
          service: 'EmployeeService',
          operation: 'getEmployeeById'
        }
      });
      throw error;
    }
  }

  /**
   * List all employees with pagination
   * @param {Object} options Pagination options
   * @returns {Promise<{employees: Array, totalCount: number, hasMore: boolean}>}
   */
  async listEmployees(options = {}) {
    logger.info('Listing employees', {
      context: {
        options,
        service: 'EmployeeService',
        operation: 'listEmployees'
      }
    });

    try {
      const result = await this.employeeRepository.listEmployees(options);

      logger.debug('Employees listed successfully', {
        context: {
          count: result.employees.length,
          totalCount: result.totalCount,
          hasMore: result.hasMore
        }
      });

      return result;
    } catch (error) {
      logger.error('Failed to list employees', {
        error,
        context: {
          options,
          service: 'EmployeeService',
          operation: 'listEmployees'
        }
      });
      throw error;
    }
  }

  /**
   * Update employee
   * @param {string} id Employee ID
   * @param {Object} updateData Update data
   * @returns {Promise<Object>} Updated employee
   */
  async updateEmployee(id, updateData) {
    logger.info('Updating employee', {
      context: {
        employeeId: id,
        updateFields: Object.keys(updateData),
        service: 'EmployeeService',
        operation: 'updateEmployee'
      }
    });

    try {
      return await this.employeeRepository.withTransaction(async () => {
        // Verify employee exists
        await this.employeeRepository.findById(id);

        const employee = await this.employeeRepository.updateEmployee(id, updateData);

        logger.info('Employee updated successfully', {
          context: {
            employeeId: id,
            employeeNumber: employee.employee_number,
            updatedFields: Object.keys(updateData)
          }
        });

        return employee;
      });
    } catch (error) {
      logger.error('Failed to update employee', {
        error,
        context: {
          employeeId: id,
          updateData,
          service: 'EmployeeService',
          operation: 'updateEmployee'
        }
      });
      throw error;
    }
  }

  /**
   * Delete employee
   * @param {string} id Employee ID
   * @returns {Promise<void>}
   */
  async deleteEmployee(id) {
    logger.info('Deleting employee', {
      context: {
        employeeId: id,
        service: 'EmployeeService',
        operation: 'deleteEmployee'
      }
    });

    try {
      await this.employeeRepository.withTransaction(async () => {
        await this.employeeRepository.deleteEmployee(id);

        logger.info('Employee deleted successfully', {
          context: {
            employeeId: id
          }
        });
      });
    } catch (error) {
      logger.error('Failed to delete employee', {
        error,
        context: {
          employeeId: id,
          service: 'EmployeeService',
          operation: 'deleteEmployee'
        }
      });
      throw error;
    }
  }

  /**
   * Validate employee number format
   * @param {string} employeeNumber Employee number to validate
   * @returns {boolean} True if valid
   */
  validateEmployeeNumber(employeeNumber) {
    const employeeNumberRegex = /^[A-Z0-9]+$/;
    if (!employeeNumberRegex.test(employeeNumber)) {
      throw new ValidationError(
        'Employee number must contain only uppercase letters and numbers',
        'employee_number'
      );
    }
    return true;
  }

  /**
   * Validate email format
   * @param {string} email Email to validate
   * @returns {boolean} True if valid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format', 'email');
    }
    return true;
  }
}
