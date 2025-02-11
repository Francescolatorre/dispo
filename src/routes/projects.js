import express from 'express';
import { ProjectService } from '../services/projectService.js';
import { logger } from '../utils/logger.js';
import { validateSchema, projectSchema, updateProjectSchema } from '../middleware/validation/project.schema.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/index.js';

const router = express.Router();
const projectService = new ProjectService();

// Get all projects with pagination and filters
router.get('/', async (req, res) => {
  const { 
    limit = 10, 
    offset = 0,
    status,
    managerId
  } = req.query;

  logger.info('Fetching projects list', {
    context: {
      limit,
      offset,
      status,
      managerId,
      route: 'GET /projects'
    }
  });

  try {
    const result = await projectService.listProjects({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      managerId: managerId ? parseInt(managerId) : undefined
    });

    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch projects', {
      error,
      context: {
        limit,
        offset,
        status,
        managerId,
        route: 'GET /projects'
      }
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single project by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  logger.info('Fetching project by ID', {
    context: {
      projectId: id,
      route: 'GET /projects/:id'
    }
  });

  try {
    const project = await projectService.getProjectById(id);
    res.json(project);
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn('Project not found', {
        context: {
          projectId: id,
          route: 'GET /projects/:id'
        }
      });
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Failed to fetch project', {
        error,
        context: {
          projectId: id,
          route: 'GET /projects/:id'
        }
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get project assignments
router.get('/:id/assignments', async (req, res) => {
  const { id } = req.params;

  logger.info('Fetching project assignments', {
    context: {
      projectId: id,
      route: 'GET /projects/:id/assignments'
    }
  });

  try {
    const assignments = await projectService.getProjectAssignments(id);
    res.json(assignments);
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn('Project not found', {
        context: {
          projectId: id,
          route: 'GET /projects/:id/assignments'
        }
      });
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Failed to fetch project assignments', {
        error,
        context: {
          projectId: id,
          route: 'GET /projects/:id/assignments'
        }
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Create new project
router.post(
  '/',
  validateSchema(projectSchema),
  async (req, res) => {
    logger.info('Creating new project', {
      context: {
        projectNumber: req.body.project_number,
        managerId: req.body.project_manager_id,
        route: 'POST /projects'
      }
    });

    try {
      const project = await projectService.createProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof ConflictError) {
        logger.warn('Project creation conflict', {
          error,
          context: {
            field: error.field,
            value: error.value,
            route: 'POST /projects'
          }
        });
        res.status(409).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Project validation failed', {
          error,
          context: {
            field: error.field,
            route: 'POST /projects'
          }
        });
        res.status(400).json({ error: error.message });
      } else if (error instanceof NotFoundError) {
        logger.warn('Project manager not found', {
          error,
          context: {
            managerId: req.body.project_manager_id,
            route: 'POST /projects'
          }
        });
        res.status(404).json({ error: error.message });
      } else {
        logger.error('Failed to create project', {
          error,
          context: {
            projectData: req.body,
            route: 'POST /projects'
          }
        });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Update project
router.put(
  '/:id',
  validateSchema(updateProjectSchema),
  async (req, res) => {
    const { id } = req.params;

    logger.info('Updating project', {
      context: {
        projectId: id,
        updateFields: Object.keys(req.body),
        route: 'PUT /projects/:id'
      }
    });

    try {
      const project = await projectService.updateProject(id, req.body);
      res.json(project);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Project not found for update', {
          context: {
            projectId: id,
            route: 'PUT /projects/:id'
          }
        });
        res.status(404).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Project update validation failed', {
          error,
          context: {
            projectId: id,
            field: error.field,
            route: 'PUT /projects/:id'
          }
        });
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Failed to update project', {
          error,
          context: {
            projectId: id,
            updateData: req.body,
            route: 'PUT /projects/:id'
          }
        });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Delete project
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  logger.info('Deleting project', {
    context: {
      projectId: id,
      route: 'DELETE /projects/:id'
    }
  });

  try {
    await projectService.deleteProject(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn('Project not found for deletion', {
        context: {
          projectId: id,
          route: 'DELETE /projects/:id'
        }
      });
      res.status(404).json({ error: error.message });
    } else if (error instanceof ConflictError) {
      logger.warn('Cannot delete project with assignments', {
        error,
        context: {
          projectId: id,
          route: 'DELETE /projects/:id'
        }
      });
      res.status(400).json({ error: error.message });
    } else {
      logger.error('Failed to delete project', {
        error,
        context: {
          projectId: id,
          route: 'DELETE /projects/:id'
        }
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
