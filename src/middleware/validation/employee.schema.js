import { ValidationError } from '../../errors/index.js';

export const employeeSchema = {
  type: 'object',
  required: [
    'name',
    'employee_number',
    'entry_date',
    'email',
    'position',
    'seniority_level',
    'work_time_factor'
  ],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      description: 'Employee full name'
    },
    employee_number: {
      type: 'string',
      pattern: '^[A-Z0-9]+$',
      description: 'Unique employee identifier'
    },
    entry_date: {
      type: 'string',
      format: 'date',
      description: 'Employee start date (YYYY-MM-DD)'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Employee email address'
    },
    phone: {
      type: 'string',
      pattern: '^[+]?[0-9\\s-]+$',
      description: 'Phone number'
    },
    position: {
      type: 'string',
      minLength: 1,
      description: 'Job position/title'
    },
    seniority_level: {
      type: 'string',
      enum: ['junior', 'mid', 'senior', 'lead', 'principal'],
      description: 'Employee seniority level'
    },
    level_code: {
      type: 'string',
      pattern: '^[A-Z][0-9]$',
      description: 'Level code (e.g., J1, M2, S3)'
    },
    qualifications: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'List of qualifications'
    },
    work_time_factor: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Work time factor (0-1)'
    },
    contract_end_date: {
      type: 'string',
      format: 'date',
      description: 'Contract end date (YYYY-MM-DD)'
    },
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'on_leave'],
      default: 'active',
      description: 'Employee status'
    },
    part_time_factor: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      default: 1,
      description: 'Part-time factor (0-1)'
    }
  },
  additionalProperties: false
};

export const updateEmployeeSchema = {
  ...employeeSchema,
  required: ['name', 'email', 'position', 'seniority_level', 'work_time_factor']
};

/**
 * Validate request body against schema
 * @param {Object} schema JSON Schema object
 * @returns {Function} Express middleware
 */
export const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error } = validate(schema, req.body);
    if (error) {
      throw new ValidationError(error.message);
    }
    next();
  };
};

/**
 * Validate data against schema
 * @param {Object} schema JSON Schema object
 * @param {Object} data Data to validate
 * @returns {Object} Validation result
 */
function validate(schema, data) {
  // Required fields validation
  for (const field of schema.required || []) {
    if (!data[field]) {
      return {
        error: {
          message: `${field} is required`
        }
      };
    }
  }

  // Properties validation
  for (const [field, value] of Object.entries(data)) {
    const fieldSchema = schema.properties[field];
    if (!fieldSchema) {
      if (!schema.additionalProperties) {
        return {
          error: {
            message: `Unknown field: ${field}`
          }
        };
      }
      continue;
    }

    // Type validation
    if (fieldSchema.type === 'string' && typeof value !== 'string') {
      return {
        error: {
          message: `${field} must be a string`
        }
      };
    }

    if (fieldSchema.type === 'number' && typeof value !== 'number') {
      return {
        error: {
          message: `${field} must be a number`
        }
      };
    }

    if (fieldSchema.type === 'array' && !Array.isArray(value)) {
      return {
        error: {
          message: `${field} must be an array`
        }
      };
    }

    // String validations
    if (fieldSchema.type === 'string') {
      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        return {
          error: {
            message: `${field} must be at least ${fieldSchema.minLength} characters`
          }
        };
      }

      if (fieldSchema.format === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return {
            error: {
              message: `${field} must be a valid email address`
            }
          };
        }
      }

      if (fieldSchema.format === 'date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            error: {
              message: `${field} must be a valid date (YYYY-MM-DD)`
            }
          };
        }
      }

      if (fieldSchema.pattern) {
        const regex = new RegExp(fieldSchema.pattern);
        if (!regex.test(value)) {
          return {
            error: {
              message: `${field} format is invalid`
            }
          };
        }
      }

      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        return {
          error: {
            message: `${field} must be one of: ${fieldSchema.enum.join(', ')}`
          }
        };
      }
    }

    // Number validations
    if (fieldSchema.type === 'number') {
      if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
        return {
          error: {
            message: `${field} must be greater than or equal to ${fieldSchema.minimum}`
          }
        };
      }

      if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
        return {
          error: {
            message: `${field} must be less than or equal to ${fieldSchema.maximum}`
          }
        };
      }
    }
  }

  return { error: null };
}