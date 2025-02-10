import express from 'express';
import { pool } from '../config/database.js';
import { validateProject } from '../middleware/validateProject.js';

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC',
      ['active']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get archived projects
router.get('/archived', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC',
      ['archived']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching archived projects:', err);
    res.status(500).json({ error: 'Failed to fetch archived projects' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', validateProject, async (req, res) => {
  try {
    const {
      name,
      start_date,
      end_date,
      project_manager_id,
      documentation_links,
      status = 'active',
      project_number = 'P' + Date.now(),
      location = 'Default Location',
      fte_count = 1
    } = req.body;

    const result = await pool.query(
      `INSERT INTO projects 
       (name, project_number, start_date, end_date, location, fte_count, project_manager_id, documentation_links, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, project_number, start_date, end_date, location, fte_count, project_manager_id, documentation_links, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', validateProject, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      start_date,
      end_date,
      project_manager_id,
      documentation_links,
      status,
      project_number = 'P' + Date.now(),
      location = 'Default Location',
      fte_count = 1
    } = req.body;

    const result = await pool.query(
      `UPDATE projects 
       SET name = $1, project_number = $2, start_date = $3, end_date = $4,
           location = $5, fte_count = $6, project_manager_id = $7,
           documentation_links = $8, status = $9
       WHERE id = $10
       RETURNING *`,
      [name, project_number, start_date, end_date, location, fte_count, project_manager_id, documentation_links, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Archive project
router.post('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE projects SET status = $1 WHERE id = $2 RETURNING *',
      ['archived', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error archiving project:', err);
    res.status(500).json({ error: 'Failed to archive project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
