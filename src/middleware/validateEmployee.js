const validateEmployee = (req, res, next) => {
  // Basic validation for employee data
  const {
    name,
    employee_number,
    entry_date,
    email,
    position,
    seniority_level,
    work_time_factor
  } = req.body;

  if (!name || !employee_number || !entry_date || !email || !position || !seniority_level || !work_time_factor) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Work time factor validation (between 0 and 1)
  if (work_time_factor < 0 || work_time_factor > 1) {
    return res.status(400).json({ message: 'Work time factor must be between 0 and 1' });
  }

  next();
};

export { validateEmployee };
