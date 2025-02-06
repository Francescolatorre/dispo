const express = require('express');
const router = express.Router();
const assignmentService = require('../services/assignmentService');
const validateAssignment = require('../middleware/validateAssignment');

/**
 * Get assignments for a project
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    const assignments = await assignmentService.getProjectAssignments(projectId);
    res.json(assignments);
  } catch (error) {
    console.error('Error getting project assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get assignments for an employee
 */
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    const assignments = await assignmentService.getEmployeeAssignments(employeeId);
    res.json(assignments);
  } catch (error) {
    console.error('Error getting employee assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get a single assignment by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }
    const assignment = await assignmentService.getAssignmentById(id);
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
router.put('/:id', validateAssignment, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }
    const assignment = await assignmentService.updateAssignment(id, req.body);
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
router.post('/:id/terminate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Termination reason is required' });
    }

    const assignment = await assignmentService.terminateAssignment(id, reason);
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
router.get('/requirement/:requirementId/history', async (req, res) => {
  try {
    const requirementId = parseInt(req.params.requirementId);
    if (isNaN(requirementId)) {
      return res.status(400).json({ error: 'Invalid requirement ID' });
    }
    const history = await assignmentService.getRequirementHistory(requirementId);
    res.json(history);
  } catch (error) {
    console.error('Error getting requirement history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Check employee availability
 */
router.get('/check-availability/:employeeId', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }

    const availability = await assignmentService.checkEmployeeAvailability(
      employeeId,
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