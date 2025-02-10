import express from 'express';
import { validateProject } from '../middleware/validateProject.js';
import * as projectService from '../services/projectService.js';

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await projectService.getActiveProjects();
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get archived projects
router.get('/archived', async (req, res) => {
  try {
    const projects = await projectService.getArchivedProjects();
    res.json(projects);
  } catch (err) {
    console.error('Error fetching archived projects:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await projectService.getProjectById(parseInt(req.params.id));
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new project
router.post('/', validateProject, async (req, res) => {
  try {
    const project = await projectService.createProject(req.body);

    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', validateProject, async (req, res) => {
  try {
    const project = await projectService.updateProject(parseInt(req.params.id), req.body);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Archive project
router.post('/:id/archive', async (req, res) => {
  try {
    const project = await projectService.archiveProject(parseInt(req.params.id));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    console.error('Error archiving project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await projectService.deleteProject(parseInt(req.params.id));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project assignments
router.get('/:id/assignments', async (req, res) => {
  try {
    const assignments = await projectService.getProjectAssignments(parseInt(req.params.id));
    res.json(assignments);
  } catch (err) {
    console.error('Error fetching project assignments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project workload
router.get('/:id/workload', async (req, res) => {
  try {
    const workload = await projectService.getProjectWorkload(parseInt(req.params.id));
    res.json(workload);
  } catch (err) {
    console.error('Error fetching project workload:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
