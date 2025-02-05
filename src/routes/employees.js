const express = require('express');
const router = express.Router();
const db = require('../config/database');
const validateEmployee = require('../middleware/validateEmployee');

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM employees ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM employees WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new employee
router.post('/', validateEmployee, async (req, res) => {
  try {
    const {
      name,
      seniority_level,
      qualifications,
      work_time_factor,
      contract_end_date
    } = req.body;

    const result = await db.query(
      `INSERT INTO employees (
        name,
        seniority_level,
        level_code,
        qualifications,
        work_time_factor,
        contract_end_date
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, seniority_level, req.body.level_code, qualifications, work_time_factor, contract_end_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update employee
router.put('/:id', validateEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      seniority_level,
      qualifications,
      work_time_factor,
      contract_end_date
    } = req.body;

    const result = await db.query(
      `UPDATE employees
       SET name = $1,
           seniority_level = $2,
           level_code = $3,
           qualifications = $4,
           work_time_factor = $5,
           contract_end_date = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, seniority_level, req.body.level_code, qualifications, work_time_factor, contract_end_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const checkResult = await db.query(
      'SELECT id FROM employees WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee has project assignments
    const assignmentResult = await db.query(
      'SELECT id FROM project_assignments WHERE employee_id = $1 LIMIT 1',
      [id]
    );

    if (assignmentResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete employee with existing project assignments'
      });
    }

    // Delete employee
    await db.query('DELETE FROM employees WHERE id = $1', [id]);
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
