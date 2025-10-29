const express = require('express');
const router = express.Router();
const assignmentService = require('../services/assignmentService');
const validateAssignment = require('../middleware/validateAssignment');
const validateId = require('../middleware/validateId');

/**
 * Get assignments for a project
 */
router.get('/project/:projectId', validateId('projectId', 'project'), async (req, res) => {
  try {
    const assignments = await assignmentService.getProjectAssignments(req.validatedId);
    res.json(assignments);
  } catch (error) {
    console.error('Error getting project assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get assignments for an employee
 */
router.get('/employee/:employeeId', validateId('employeeId', 'employee'), async (req, res) => {
  try {
    const assignments = await assignmentService.getEmployeeAssignments(req.validatedId);
    res.json(assignments);
  } catch (error) {
    console.error('Error getting employee assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get a single assignment by ID
 */
router.get('/:id', validateId('id', 'assignment'), async (req, res) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.validatedId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    console.error('Error getting assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new assignment
 */
router.post('/', validateAssignment, async (req, res) => {
  try {
    const assignment = await assignmentService.createAssignment(req.body);
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Referenced record not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Update an assignment
 */
router.put('/:id', validateId('id', 'assignment'), validateAssignment, async (req, res) => {
  try {
    const assignment = await assignmentService.updateAssignment(req.validatedId, req.body);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Terminate an assignment
 */
router.post('/:id/terminate', validateId('id', 'assignment'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Termination reason is required' });
    }

    const assignment = await assignmentService.terminateAssignment(req.validatedId, reason);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    console.error('Error terminating assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get assignment history for a requirement
 */
router.get('/requirement/:requirementId/history', validateId('requirementId', 'requirement'), async (req, res) => {
  try {
    const history = await assignmentService.getRequirementHistory(req.validatedId);
    res.json(history);
  } catch (error) {
    console.error('Error getting requirement history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Check employee availability
 */
router.get('/check-availability/:employeeId', validateId('employeeId', 'employee'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }

    const availability = await assignmentService.checkEmployeeAvailability(
      req.validatedId,
      start_date,
      end_date
    );
    res.json(availability);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;