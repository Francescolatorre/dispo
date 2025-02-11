const validateRequirement = (req, res, next) => {
  const {
    project_id,
    role,
    seniority_level,
    start_date,
    end_date,
    required_qualifications,
    priority,
    notes
  } = req.body;

  const errors = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isUpdate = req.method === 'PUT';

  // For POST requests, validate required fields
  // For PUT requests, only validate fields that are present
  if (!isUpdate) {
    if (!project_id || !Number.isInteger(project_id) || project_id < 1) {
      errors.push('Valid project ID is required');
    }

    if (!role || typeof role !== 'string' || role.trim().length < 2) {
      errors.push('Role must be at least 2 characters long');
    }

    if (!start_date || !dateRegex.test(start_date)) {
      errors.push('Start date must be in YYYY-MM-DD format');
    }

    if (!end_date || !dateRegex.test(end_date)) {
      errors.push('End date must be in YYYY-MM-DD format');
    }

    const validLevels = ['Junior', 'Mid', 'Senior', 'Lead'];
    if (!seniority_level || !validLevels.includes(seniority_level)) {
      errors.push(`Seniority level must be one of: ${validLevels.join(', ')}`);
    }
  } else {
    // Validate fields only if they are present in the update
    if (project_id !== undefined && (!Number.isInteger(project_id) || project_id < 1)) {
      errors.push('Valid project ID is required');
    }

    if (role !== undefined && (typeof role !== 'string' || role.trim().length < 2)) {
      errors.push('Role must be at least 2 characters long');
    }

    if (start_date !== undefined && !dateRegex.test(start_date)) {
      errors.push('Start date must be in YYYY-MM-DD format');
    }

    if (end_date !== undefined && !dateRegex.test(end_date)) {
      errors.push('End date must be in YYYY-MM-DD format');
    }

    const validLevels = ['Junior', 'Mid', 'Senior', 'Lead'];
    if (seniority_level !== undefined && !validLevels.includes(seniority_level)) {
      errors.push(`Seniority level must be one of: ${validLevels.join(', ')}`);
    }
  }

  // Common validations for both POST and PUT
  if (start_date && end_date) {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (endDate < startDate) {
      errors.push('End date must be after start date');
    }
  }

  if (required_qualifications !== undefined && !Array.isArray(required_qualifications)) {
    errors.push('Required qualifications must be an array');
  }

  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (priority !== undefined && !validPriorities.includes(priority)) {
    errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
  }

  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 1000)) {
    errors.push('Notes must be a string no longer than 1000 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

export default validateRequirement;