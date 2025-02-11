import express from 'express';
import { RequirementService } from '../services/requirementService.js';
import { logger } from '../utils/logger.js';
import { validateSchema, requirementSchema, updateRequirementSchema } from '../middleware/validation/requirement.schema.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/index.js';

const router = express.Router();
const requirementService = new RequirementService();

// Get all requirements with pagination and filters
router.get('/', async (req, res) => {
  const { 
    limit = 10, 
    offset = 0,
    projectId,
    status,
    priority
  } = req.query;

  logger.info('Fetching requirements list', {
    context: {
      limit,
      offset,
      projectId,
      status,
      priority,
      route: 'GET /requirements'
    }
  });

  try {
    const result = await requirementService.listRequirements({
      limit: parseInt(limit),
      offset: parseInt(offset),
      projectId: projectId ? parseInt(projectId) : undefined,
      status,
      priority
    });

    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch requirements', {
      error,
      context: {
        limit,
        offset,
        projectId,
        status,
        priority,
        route: 'GET /requirements'
      }
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single requirement by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  logger.info('Fetching requirement by ID', {
    context: {
      requirementId: id,
      route: 'GET /requirements/:id'
    }
  });

  try {
    const requirement = await requirementService.getRequirementById(id);
    res.json(requirement);
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn('Requirement not found', {
        context: {
          requirementId: id,
          route: 'GET /requirements/:id'
        }
      });
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Failed to fetch requirement', {
        error,
        context: {
          requirementId: id,
          route: 'GET /requirements/:id'
        }
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get project requirements
router.get('/project/:projectId', async (req, res) => {
  const { projectId } = req.params;

  logger.info('Fetching project requirements', {
    context: {
      projectId,
      route: 'GET /requirements/project/:projectId'
    }
  });

  try {
    const requirements = await requirementService.getProjectRequirements(projectId);
    res.json(requirements);
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn('Project not found', {
        context: {
          projectId,
          route: 'GET /requirements/project/:projectId'
        }
      });
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Failed to fetch project requirements', {
        error,
        context: {
          projectId,
          route: 'GET /requirements/project/:projectId'
        }
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Create new requirement
router.post(
  '/',
  validateSchema(requirementSchema),
  async (req, res) => {
    logger.info('Creating new requirement', {
      context: {
        projectId: req.body.project_id,
        role: req.body.role,
        route: 'POST /requirements'
      }
    });

    try {
      const requirement = await requirementService.createRequirement(req.body);
      res.status(201).json(requirement);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Project not found', {
          error,
          context: {
            projectId: req.body.project_id,
            route: 'POST /requirements'
          }
        });
        res.status(404).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Requirement validation failed', {
          error,
          context: {
            field: error.field,
            route: 'POST /requirements'
          }
        });
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Failed to create requirement', {
          error,
          context: {
            requirementData: req.body,
            route: 'POST /requirements'
          }
        });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Update requirement
router.put(
  '/:id',
  validateSchema(updateRequirementSchema),
  async (req, res) => {
    const { id } = req.params;

    logger.info('Updating requirement', {
      context: {
        requirementId: id,
        updateFields: Object.keys(req.body),
        route: 'PUT /requirements/:id'
      }
    });

    try {
      const requirement = await requirementService.updateRequirement(id, req.body);
      res.json(requirement);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Requirement not found for update', {
          context: {
            requirementId: id,
            route: 'PUT /requirements/:id'
          }
        });
        res.status(404).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Requirement update validation failed', {
          error,
          context: {
            requirementId: id,
            field: error.field,
            route: 'PUT /requirements/:id'
          }
        });
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Failed to update requirement', {
          error,
          context: {
            requirementId: id,
            updateData: req.body,
            route: 'PUT /requirements/:id'
          }
        });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Update requirement status
router.put(
  '/:id/status',
  async (req, res) => {
    const { id } = req.params;
    const { status, assignmentId } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    logger.info('Updating requirement status', {
      context: {
        requirementId: id,
        status,
        assignmentId,
        route: 'PUT /requirements/:id/status'
      }
    });

    try {
      const requirement = await requirementService.updateRequirementStatus(
        id,
        status,
        assignmentId
      );
      res.json(requirement);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Requirement not found for status update', {
          context: {
            requirementId: id,
            route: 'PUT /requirements/:id/status'
          }
        });
        res.status(404).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Invalid status update', {
          error,
          context: {
            requirementId: id,
            status,
            route: 'PUT /requirements/:id/status'
          }
        });
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Failed to update requirement status', {
          error,
          context: {
            requirementId: id,
            status,
            assignmentId,
            route: 'PUT /requirements/:id/status'
          }
        });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Delete requirement
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  logger.info('Deleting requirement', {
    context: {
      requirementId: id,
      route: 'DELETE /requirements/:id'
    }
  });

  try {
    await requirementService.deleteRequirement(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn('Requirement not found for deletion', {
        context: {
          requirementId: id,
          route: 'DELETE /requirements/:id'
        }
      });
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Failed to delete requirement', {
        error,
        context: {
          requirementId: id,
          route: 'DELETE /requirements/:id'
        }
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;