import pool from '../config/database.js';
import assignmentService from '../services/assignmentService.js';

const validateAssignment = async (req, res, next) => {
  const {
    project_id,
    employee_id,
    requirement_id,
    role,
    start_date,
    end_date,
    allocation_percentage,
    dr_status,
    position_status
  } = req.body;

  const errors = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isUpdate = req.method === 'PUT';

  // For POST requests, validate all required fields
  // For PUT requests, only validate fields that are present
  if (!isUpdate) {
    if (!project_id || !Number.isInteger(project_id) || project_id < 1) {
      errors.push('Valid project ID is required');
    }

    if (!employee_id || !Number.isInteger(employee_id) || employee_id < 1) {
      errors.push('Valid employee ID is required');
    }

    if (!requirement_id || !Number.isInteger(requirement_id) || requirement_id < 1) {
      errors.push('Valid requirement ID is required');
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

    if (!allocation_percentage || 
        typeof allocation_percentage !== 'number' || 
        allocation_percentage <= 0 || 
        allocation_percentage > 100) {
      errors.push('Allocation percentage must be between 0 and 100');
    }
  } else {
    // Validate fields only if they are present in the update
    if (project_id !== undefined && (!Number.isInteger(project_id) || project_id < 1)) {
      errors.push('Valid project ID is required');
    }

    if (employee_id !== undefined && (!Number.isInteger(employee_id) || employee_id < 1)) {
      errors.push('Valid employee ID is required');
    }

    if (requirement_id !== undefined && (!Number.isInteger(requirement_id) || requirement_id < 1)) {
      errors.push('Valid requirement ID is required');
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

    if (allocation_percentage !== undefined && 
        (typeof allocation_percentage !== 'number' || 
        allocation_percentage <= 0 || 
        allocation_percentage > 100)) {
      errors.push('Allocation percentage must be between 0 and 100');
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

  // Optional field validations
  if (dr_status !== undefined && typeof dr_status !== 'string') {
    errors.push('DR status must be a string');
  }

  if (position_status !== undefined && typeof position_status !== 'string') {
    errors.push('Position status must be a string');
  }

  // If there are basic validation errors, return them early
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Check employee availability if dates or allocation is being updated
    if (employee_id && (start_date || end_date || allocation_percentage)) {
      const overlappingAssignments = await assignmentService.checkEmployeeAvailability(
        employee_id,
        start_date,
        end_date
      );

      // Calculate total allocation for the period
      let totalAllocation = allocation_percentage || 0;
      for (const assignment of overlappingAssignments) {
        // Skip current assignment if updating
        if (req.params.id && assignment.id === parseInt(req.params.id)) {
          continue;
        }
        totalAllocation += parseFloat(assignment.allocation_percentage);
      }

      if (totalAllocation > 100) {
        return res.status(400).json({
          errors: ['Total allocation percentage exceeds 100% for the given period'],
          details: {
            proposed_allocation: allocation_percentage,
            existing_allocations: overlappingAssignments,
            total_allocation: totalAllocation
          }
        });
      }

      // Store overlapping assignments in request for route handler
      req.overlappingAssignments = overlappingAssignments;
    }

    // For new assignments or when requirement_id is being updated
    if (requirement_id && (start_date || end_date)) {
      // Check if requirement exists and dates are within requirement period
      const requirementResult = await pool.query(
        'SELECT start_date::text, end_date::text FROM project_requirements WHERE id = $1',
        [requirement_id]
      );

      if (requirementResult.rows.length === 0) {
        return res.status(404).json({ 
          errors: ['Requirement not found'] 
        });
      }

      const requirement = requirementResult.rows[0];
      const reqStartDate = requirement.start_date;
      const reqEndDate = requirement.end_date;
      const assignStartDate = start_date || requirement.start_date;
      const assignEndDate = end_date || requirement.end_date;

      if (assignStartDate < reqStartDate || assignEndDate > reqEndDate) {
        return res.status(400).json({
          errors: ['Assignment dates must fall within requirement period'],
          details: {
            requirement_period: { start: reqStartDate, end: reqEndDate },
            assignment_period: { start: assignStartDate, end: assignEndDate }
          }
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in assignment validation:', error);
    res.status(500).json({ 
      errors: ['Internal server error during validation'] 
    });
  }
};

export default validateAssignment;