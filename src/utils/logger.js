/**
 * Logger utility for structured logging with error context and data masking
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Mask sensitive data in logs
 * @param {string} value Value to mask
 * @param {string} type Type of data to mask
 * @returns {string} Masked value
 */
const maskSensitiveData = (value, type = 'default') => {
  if (!value) return value;

  const masks = {
    email: (email) => {
      const [local, domain] = email.split('@');
      return `${local.charAt(0)}***@${domain}`;
    },
    password: () => '********',
    token: (token) => `${token.slice(0, 4)}...${token.slice(-4)}`,
    default: (val) => `${String(val).slice(0, 1)}***${String(val).slice(-1)}`
  };

  return (masks[type] || masks.default)(value);
};

/**
 * Format error object for logging
 * @param {Error} error Error object
 * @returns {Object} Formatted error
 */
const formatError = (error) => {
  if (!error) return null;

  return {
    message: error.message,
    name: error.name,
    code: error.code,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    details: error.details
  };
};

/**
 * Format context object for logging
 * @param {Object} context Context object
 * @returns {Object} Formatted context
 */
const formatContext = (context = {}) => {
  const { email, password, token, ...rest } = context;

  return {
    ...rest,
    ...(email && { email: maskSensitiveData(email, 'email') }),
    ...(password && { password: maskSensitiveData(password, 'password') }),
    ...(token && { token: maskSensitiveData(token, 'token') }),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };
};

/**
 * Log an error with context
 * @param {string} message Error message
 * @param {Object} options Logging options
 * @param {Error} options.error Error object
 * @param {Object} options.context Additional context
 */
const error = (message, { error: err, context = {} } = {}) => {
  console.error(JSON.stringify({
    level: LOG_LEVELS.ERROR,
    message,
    error: formatError(err),
    context: formatContext(context)
  }));
};

/**
 * Log a warning with context
 * @param {string} message Warning message
 * @param {Object} context Additional context
 */
const warn = (message, context = {}) => {
  console.warn(JSON.stringify({
    level: LOG_LEVELS.WARN,
    message,
    context: formatContext(context)
  }));
};

/**
 * Log info with context
 * @param {string} message Info message
 * @param {Object} context Additional context
 */
const info = (message, context = {}) => {
  console.info(JSON.stringify({
    level: LOG_LEVELS.INFO,
    message,
    context: formatContext(context)
  }));
};

/**
 * Log debug information with context
 * @param {string} message Debug message
 * @param {Object} context Additional context
 */
const debug = (message, context = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(JSON.stringify({
      level: LOG_LEVELS.DEBUG,
      message,
      context: formatContext(context)
    }));
  }
};

export const logger = {
  error,
  warn,
  info,
  debug,
  maskSensitiveData
};