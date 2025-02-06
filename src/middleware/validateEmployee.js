const LEVEL_CODES = {
  Junior: 'JR',
  Mid: 'MID',
  Senior: 'SR',
  Lead: 'LD'
};

const validateEmployee = (req, res, next) => {
  const {
    name,
    employee_number,
    entry_date,
    email,
    phone,
    position,
    seniority_level,
    qualifications,
    work_time_factor,
    contract_end_date,
    status,
    part_time_factor
  } = req.body;

  const errors = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!employee_number || !/^EMP-\d{4}$/.test(employee_number)) {
    errors.push('Employee number must be in format EMP-XXXX (4 digits)');
  }

  if (!entry_date || !dateRegex.test(entry_date)) {
    errors.push('Valid entry date (YYYY-MM-DD) is required');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email address is required');
  }

  if (!position || typeof position !== 'string' || position.trim().length < 2) {
    errors.push('Position must be at least 2 characters long');
  }

  // Validate seniority_level and set level_code
  const validLevels = ['Junior', 'Mid', 'Senior', 'Lead'];
  if (!seniority_level || !validLevels.includes(seniority_level)) {
    errors.push(`Seniority level must be one of: ${validLevels.join(', ')}`);
  } else {
    req.body.level_code = LEVEL_CODES[seniority_level];
  }

  // Validate qualifications
  if (!Array.isArray(qualifications)) {
    errors.push('Qualifications must be an array');
  }

  // Validate work_time_factor
  const parsedWorkTimeFactor = parseFloat(work_time_factor);
  if (isNaN(parsedWorkTimeFactor) || parsedWorkTimeFactor <= 0 || parsedWorkTimeFactor > 1) {
    errors.push('Work time factor must be between 0.01 and 1.00');
  } else {
    req.body.work_time_factor = parsedWorkTimeFactor;
  }

  // Validate contract_end_date if provided
  if (contract_end_date && !dateRegex.test(contract_end_date)) {
    errors.push('Contract end date must be in YYYY-MM-DD format');
  }

  // Validate status
  const validStatuses = ['active', 'inactive', 'on_leave'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Validate part_time_factor
  const parsedPartTime = parseFloat(part_time_factor);
  if (isNaN(parsedPartTime) || parsedPartTime < 0 || parsedPartTime > 100) {
    errors.push('Part time factor must be between 0 and 100');
  } else {
    req.body.part_time_factor = parsedPartTime;
  }

  // Set defaults
  req.body.status = status || 'active';
  req.body.part_time_factor = parsedPartTime || 100.00;

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = validateEmployee;
