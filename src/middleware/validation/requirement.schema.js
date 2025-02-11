import { ValidationError } from '../../errors/index.js';

export const requirementSchema = {
  type: 'object',
  required: [
    'project_id',
    'role',
    'seniority_level',
    'start_date',
    'end_date'
  ],
  properties: {
    project_id: {
      type: 'integer',
      minimum: 1,
      description: 'ID of the project'
    },
    role: {
      type: 'string',
      maxLength: 255,
      description: 'Required role for the position'
    },
    seniority_level: {
      type: 'string',
      enum: ['Junior', 'Mid', 'Senior', 'Lead'],
      maxLength: 50,
      description: 'Required seniority level'
    },
    required_qualifications: {
      type: 'array',
      items: {
        type: 'string'
      },
      default: [],
      description: 'List of required qualifications'
    },
    start_date: {
      type: 'string',
      format: 'date',
      description: 'When this role is needed from (YYYY-MM-DD)'
    },
    end_date: {
      type: 'string',
      format: 'date',
      description: 'When this role is needed until (YYYY-MM-DD)'
    },
    status: {
      type: 'string',
      enum: ['open', 'partially_filled', 'filled', 'needs_replacement'],
      default: 'open',
      description: 'Current status of this requirement'
    },
    priority: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      description: 'Priority level for filling this requirement'
    },
    coverage_needed: {
      type: 'object',
      properties: {
        periods: {
          type: 'array',
          items: {
            type: 'object',
            required: ['start_date', 'end_date'],
            properties: {
              start_date: {
                type: 'string',
                format: 'date',
                description: 'Period start date (YYYY-MM-DD)'
              },
              end_date: {
                type: 'string',
                format: 'date',
                description: 'Period end date (YYYY-MM-DD)'
              }
            }
          }
        }
      },
      description: 'Time periods where coverage is still needed'
    },
    notes: {
      type: 'string',
      maxLength: 1000,
      nullable: true,
      description: 'Additional requirements or notes'
    }
  },
  additionalProperties: false
};

export const updateRequirementSchema = {
  type: 'object',
  properties: {
    role: requirementSchema.properties.role,
    seniority_level: requirementSchema.properties.seniority_level,
    required_qualifications: requirementSchema.properties.required_qualifications,
    end_date: requirementSchema.properties.end_date,
    status: requirementSchema.properties.status,
    priority: requirementSchema.properties.priority,
    coverage_needed: requirementSchema.properties.coverage_needed,
    notes: requirementSchema.properties.notes
  },
  additionalProperties: false
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

    if (fieldSchema.type === 'integer' && !Number.isInteger(value)) {
      return {
        error: {
          message: `${field} must be an integer`
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
      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        return {
          error: {
            message: `${field} must be at most ${fieldSchema.maxLength} characters`
          }
        };
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

      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        return {
          error: {
            message: `${field} must be one of: ${fieldSchema.enum.join(', ')}`
          }
        };
      }
    }

    // Array validations
    if (fieldSchema.type === 'array' && Array.isArray(value)) {
      for (const item of value) {
        const itemSchema = fieldSchema.items;
        if (itemSchema.type === 'string' && typeof item !== 'string') {
          return {
            error: {
              message: `${field} items must be strings`
            }
          };
        }
      }
    }

    // Object validations
    if (fieldSchema.type === 'object' && typeof value === 'object') {
      if (field === 'coverage_needed' && value.periods) {
        for (const period of value.periods) {
          if (!period.start_date || !period.end_date) {
            return {
              error: {
                message: 'Coverage periods must have start_date and end_date'
              }
            };
          }

          const startDate = new Date(period.start_date);
          const endDate = new Date(period.end_date);

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
              error: {
                message: 'Coverage period dates must be valid dates (YYYY-MM-DD)'
              }
            };
          }

          if (endDate < startDate) {
            return {
              error: {
                message: 'Coverage period end_date must be after start_date'
              }
            };
          }
        }
      }
    }
  }

  // Date range validation
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    
    if (endDate < startDate) {
      return {
        error: {
          message: 'end_date must be after start_date'
        }
      };
    }
  }

  return { error: null };
}