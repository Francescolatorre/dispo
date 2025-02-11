import { ValidationError } from '../../errors/index.js';

export const projectSchema = {
  type: 'object',
  required: [
    'name',
    'project_number',
    'start_date',
    'end_date',
    'location',
    'project_manager_id'
  ],
  properties: {
    name: {
      type: 'string',
      minLength: 2,
      maxLength: 255,
      description: 'Project name'
    },
    project_number: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      description: 'Unique project identifier'
    },
    start_date: {
      type: 'string',
      format: 'date',
      description: 'Project start date (YYYY-MM-DD)'
    },
    end_date: {
      type: 'string',
      format: 'date',
      description: 'Project end date (YYYY-MM-DD)'
    },
    location: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Project location'
    },
    project_manager_id: {
      type: 'integer',
      minimum: 1,
      description: 'ID of the employee managing this project'
    },
    documentation_links: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri',
        pattern: '^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w .-]*)*\\/?$'
      },
      default: [],
      description: 'List of URLs to project documentation'
    },
    status: {
      type: 'string',
      enum: ['active', 'archived'],
      default: 'active',
      description: 'Current project status'
    }
  },
  additionalProperties: false
};

export const updateProjectSchema = {
  type: 'object',
  required: ['name', 'location', 'project_manager_id'],
  properties: {
    name: projectSchema.properties.name,
    location: projectSchema.properties.location,
    project_manager_id: projectSchema.properties.project_manager_id,
    documentation_links: projectSchema.properties.documentation_links,
    status: projectSchema.properties.status,
    end_date: projectSchema.properties.end_date
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
      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        return {
          error: {
            message: `${field} must be at least ${fieldSchema.minLength} characters`
          }
        };
      }

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

      if (fieldSchema.format === 'uri' && fieldSchema.pattern) {
        const regex = new RegExp(fieldSchema.pattern);
        if (!regex.test(value)) {
          return {
            error: {
              message: `${field} must be a valid URL`
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

    // Integer validations
    if (fieldSchema.type === 'integer') {
      if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
        return {
          error: {
            message: `${field} must be greater than or equal to ${fieldSchema.minimum}`
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

        if (itemSchema.format === 'uri' && itemSchema.pattern) {
          const regex = new RegExp(itemSchema.pattern);
          if (!regex.test(item)) {
            return {
              error: {
                message: `${field} items must be valid URLs`
              }
            }
          }
        }
      }
    }
  }

  // Date range validation for projects
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