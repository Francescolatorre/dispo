const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const validateProject = require('../middleware/validateProject');

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
      project_manager,
      documentation_links,
      status = 'active',
    } = req.body;

    const result = await pool.query(
      `INSERT INTO projects 
       (name, start_date, end_date, project_manager, documentation_links, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, start_date, end_date, project_manager, documentation_links, status]
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
      project_manager,
      documentation_links,
      status,
    } = req.body;

    const result = await pool.query(
      `UPDATE projects 
       SET name = $1, start_date = $2, end_date = $3, 
           project_manager = $4, documentation_links = $5, status = $6
       WHERE id = $7
       RETURNING *`,
      [name, start_date, end_date, project_manager, documentation_links, status, id]
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

module.exports = router;
