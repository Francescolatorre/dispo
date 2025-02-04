const validateProject = (req, res, next) => {
  const { name, start_date, end_date, project_manager, documentation_links, status } = req.body;

  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Validate project manager
  if (!project_manager || typeof project_manager !== 'string' || project_manager.trim().length < 2) {
    errors.push('Project manager name must be at least 2 characters long');
  }

  // Validate dates
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!start_date || !dateRegex.test(start_date)) {
    errors.push('Start date must be in YYYY-MM-DD format');
  }
  if (!end_date || !dateRegex.test(end_date)) {
    errors.push('End date must be in YYYY-MM-DD format');
  }

  if (start_date && end_date) {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (endDate < startDate) {
      errors.push('End date must be after start date');
    }
  }

  // Validate documentation links
  if (!Array.isArray(documentation_links)) {
    errors.push('Documentation links must be an array');
  } else {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    documentation_links.forEach((link, index) => {
      if (typeof link !== 'string' || !urlRegex.test(link)) {
        errors.push(`Invalid URL format for documentation link at position ${index}`);
      }
    });
  }

  // Validate status
  const validStatuses = ['active', 'archived'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = validateProject;
