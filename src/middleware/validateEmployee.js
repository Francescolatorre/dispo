const LEVEL_CODES = {
  Junior: 'JR',
  Mid: 'MID',
  Senior: 'SR',
  Lead: 'LD'
};

const validateEmployee = (req, res, next) => {
  const { name, seniority_level, qualifications, work_time_factor } = req.body;

  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Validate seniority_level and set level_code
  const validLevels = ['Junior', 'Mid', 'Senior', 'Lead'];
  if (!seniority_level || !validLevels.includes(seniority_level)) {
    errors.push(`Seniority level must be one of: ${validLevels.join(', ')}`);
  } else {
    // Automatically set the level_code based on seniority_level
    req.body.level_code = LEVEL_CODES[seniority_level];
  }

  // Validate qualifications
  if (!Array.isArray(qualifications) || qualifications.length === 0) {
    errors.push('At least one qualification is required');
  }

  // Validate work_time_factor
  if (typeof work_time_factor !== 'number' || work_time_factor <= 0 || work_time_factor > 1) {
    errors.push('Work time factor must be a number between 0 and 1');
  }

  // Optional contract_end_date validation
  if (req.body.contract_end_date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(req.body.contract_end_date)) {
      errors.push('Contract end date must be in YYYY-MM-DD format');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = validateEmployee;
