import { ValidationError } from '../../errors/index.js';

export const loginSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address'
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'User password (min 8 characters)'
    }
  },
  additionalProperties: false
};

export const changePasswordSchema = {
  type: 'object',
  required: ['currentPassword', 'newPassword'],
  properties: {
    currentPassword: {
      type: 'string',
      minLength: 8,
      description: 'Current password'
    },
    newPassword: {
      type: 'string',
      minLength: 8,
      description: 'New password (min 8 characters)'
    }
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
  // Basic validation
  for (const field of schema.required || []) {
    if (!data[field]) {
      return {
        error: {
          message: `${field} is required`
        }
      };
    }
  }

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

    // String format validation
    if (fieldSchema.type === 'string') {
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

      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        return {
          error: {
            message: `${field} must be at least ${fieldSchema.minLength} characters`
          }
        };
      }
    }
  }

  return { error: null };
}