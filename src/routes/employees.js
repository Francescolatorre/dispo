import express from 'express';
import pool from '../config/database.js';
import validateEmployee from '../middleware/validateEmployee.js';

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
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
    const result = await pool.query(
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
      employee_number,
      entry_date,
      email,
      phone,
      position,
      seniority_level,
      qualifications,
      work_time_factor,
      contract_end_date,
      status,
      part_time_factor
    } = req.body;

    const result = await pool.query(
      `INSERT INTO employees (
        name,
        employee_number,
        entry_date,
        email,
        phone,
        position,
        seniority_level,
        level_code,
        qualifications,
        work_time_factor,
        contract_end_date,
        status,
        part_time_factor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        name,
        employee_number,
        entry_date,
        email,
        phone,
        position,
        seniority_level,
        req.body.level_code,
        qualifications,
        work_time_factor,
        contract_end_date,
        status,
        part_time_factor
      ]
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
      email,
      phone,
      position,
      seniority_level,
      qualifications,
      work_time_factor,
      contract_end_date,
      status,
      part_time_factor
    } = req.body;

    const result = await pool.query(
      `UPDATE employees
       SET name = $1,
           seniority_level = $2,
           level_code = $3,
           qualifications = $4,
           work_time_factor = $5,
           contract_end_date = $6,
           email = $7,
           phone = $8,
           position = $9,
           status = $10,
           part_time_factor = $11,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [name, seniority_level, req.body.level_code, qualifications, work_time_factor, contract_end_date, email, phone, position, status, part_time_factor, id]
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
    const checkResult = await pool.query(
      'SELECT id FROM employees WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee has project assignments
    const assignmentResult = await pool.query(
      'SELECT id FROM project_assignments WHERE employee_id = $1 LIMIT 1',
      [id]
    );

    if (assignmentResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete employee with existing project assignments'
      });
    }

    // Delete employee
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
