import express from 'express';
import { EmployeeService } from '../services/employeeService.js';
import { logger } from '../utils/logger.js';
import { validateSchema, employeeSchema, updateEmployeeSchema } from '../middleware/validation/employee.schema.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/index.js';

const router = express.Router();
const employeeService = new EmployeeService();

// Get all employees with pagination
router.get('/', async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;

  logger.info('Fetching employees list', {
    context: {
      limit,
      offset,
      route: 'GET /employees'
    }
  });

  try {
    const result = await employeeService.listEmployees({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch employees', {
      error,
      context: {
        limit,
        offset,
        route: 'GET /employees'
      }
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single employee by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  logger.info('Fetching employee by ID', {
    context: {
      employeeId: id,
      route: 'GET /employees/:id'
    }
  });

  try {
    const employee = await employeeService.getEmployeeById(id);
    res.json(employee);
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn('Employee not found', {
        context: {
          employeeId: id,
          route: 'GET /employees/:id'
        }
      });
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Failed to fetch employee', {
        error,
        context: {
          employeeId: id,
          route: 'GET /employees/:id'
        }
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Create new employee
router.post(
  '/',
  validateSchema(employeeSchema),
  async (req, res) => {
    logger.info('Creating new employee', {
      context: {
        employeeNumber: req.body.employee_number,
        email: req.body.email,
        route: 'POST /employees'
      }
    });

    try {
      const employee = await employeeService.createEmployee(req.body);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof ConflictError) {
        logger.warn('Employee creation conflict', {
          error,
          context: {
            field: error.field,
            value: error.value,
            route: 'POST /employees'
          }
        });
        res.status(409).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Employee validation failed', {
          error,
          context: {
            field: error.field,
            route: 'POST /employees'
          }
        });
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Failed to create employee', {
          error,
          context: {
            employeeData: req.body,
            route: 'POST /employees'
          }
        });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Update employee
router.put(
  '/:id',
  validateSchema(updateEmployeeSchema),
  async (req, res) => {
    const { id } = req.params;

    logger.info('Updating employee', {
      context: {
        employeeId: id,
        updateFields: Object.keys(req.body),
        route: 'PUT /employees/:id'
      }
    });

    try {
      const employee = await employeeService.updateEmployee(id, req.body);
      res.json(employee);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Employee not found for update', {
          context: {
            employeeId: id,
            route: 'PUT /employees/:id'
          }
        });
        res.status(404).json({ error: error.message });
      } else if (error instanceof ConflictError) {
        logger.warn('Employee update conflict', {
          error,
          context: {
            employeeId: id,
            field: error.field,
            route: 'PUT /employees/:id'
          }
        });
        res.status(409).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Employee update validation failed', {
          error,
          context: {
            employeeId: id,
            field: error.field,
            route: 'PUT /employees/:id'
          }
        });
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Failed to update employee', {
          error,
          context: {
            employeeId: id,
            updateData: req.body,
            route: 'PUT /employees/:id'
          }
        });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Delete employee
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  logger.info('Deleting employee', {
    context: {
      employeeId: id,
      route: 'DELETE /employees/:id'
    }
  });

  try {
    await employeeService.deleteEmployee(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn('Employee not found for deletion', {
        context: {
          employeeId: id,
          route: 'DELETE /employees/:id'
        }
      });
      res.status(404).json({ error: error.message });
    } else if (error instanceof ConflictError) {
      logger.warn('Cannot delete employee with assignments', {
        error,
        context: {
          employeeId: id,
          route: 'DELETE /employees/:id'
        }
      });
      res.status(400).json({ error: error.message });
    } else {
      logger.error('Failed to delete employee', {
        error,
        context: {
          employeeId: id,
          route: 'DELETE /employees/:id'
        }
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
