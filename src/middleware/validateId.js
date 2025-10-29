/**
 * Middleware to validate integer ID from route parameters
 * @param {string} paramName - The name of the parameter to validate (e.g., 'id', 'projectId', 'employeeId')
 * @param {string} resourceName - The name of the resource for error messages (e.g., 'project', 'employee', 'assignment')
 * @returns {Function} Express middleware function
 */
const validateId = (paramName, resourceName) => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);

    if (isNaN(id)) {
      return res.status(400).json({
        error: `Invalid ${resourceName} ID`
      });
    }

    // Attach validated ID to request for use in route handler
    req.validatedId = id;
    next();
  };
};

module.exports = validateId;
