const express = require('express');
const router = express.Router();
const requirementService = require('../services/requirementService');
const validateRequirement = require('../middleware/validateRequirement');
const validateId = require('../middleware/validateId');

/**
 * Get all requirements for a project
 */
router.get('/project/:projectId', validateId('projectId', 'project'), async (req, res) => {
  try {
    const requirements = await requirementService.getProjectRequirements(req.validatedId);
    res.json(requirements);
  } catch (error) {
    console.error('Error getting project requirements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get a single requirement by ID
 */
router.get('/:id', validateId('id', 'requirement'), async (req, res) => {
  try {
    const requirement = await requirementService.getRequirementById(req.validatedId);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    res.json(requirement);
  } catch (error) {
    console.error('Error getting requirement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new requirement
 */
router.post('/', validateRequirement, async (req, res) => {
  try {
    const projectId = parseInt(req.body.project_id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    req.body.project_id = projectId;
    const requirement = await requirementService.createRequirement(req.body);
    res.status(201).json(requirement);
  } catch (error) {
    console.error('Error creating requirement:', error);
    if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Project not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Update a requirement
 */
router.put('/:id', validateId('id', 'requirement'), validateRequirement, async (req, res) => {
  try {
    const requirement = await requirementService.updateRequirement(req.validatedId, req.body);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    res.json(requirement);
  } catch (error) {
    console.error('Error updating requirement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a requirement
 */
router.delete('/:id', validateId('id', 'requirement'), async (req, res) => {
  try {
    await requirementService.deleteRequirement(req.validatedId);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting requirement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get coverage analysis for a requirement
 */
router.get('/:id/coverage', validateId('id', 'requirement'), async (req, res) => {
  try {
    const requirement = await requirementService.getRequirementById(req.validatedId);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    const coverage = await requirementService.getRequirementCoverage(req.validatedId);
    if (!coverage) {
      return res.json({ periods: [] });
    }
    res.json(coverage);
  } catch (error) {
    console.error('Error getting requirement coverage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Find matching employees for a requirement
 */
router.get('/:id/matching-employees', validateId('id', 'requirement'), async (req, res) => {
  try {
    const requirement = await requirementService.getRequirementById(req.validatedId);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    const employees = await requirementService.findMatchingEmployees(req.validatedId);
    res.json(employees);
  } catch (error) {
    console.error('Error finding matching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;