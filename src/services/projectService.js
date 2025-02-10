import { pool } from '../config/database.js';

/**
 * Get all active projects
 */
export const getActiveProjects = async () => {
  const result = await pool.query(
    'SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC',
    ['active']
  );
  return result.rows;
};

/**
 * Get all archived projects
 */
export const getArchivedProjects = async () => {
  const result = await pool.query(
    'SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC',
    ['archived']
  );
  return result.rows;
};

/**
 * Get project by ID
 */
export const getProjectById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM projects WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

/**
 * Create new project
 */
export const createProject = async ({
  name,
  start_date,
  end_date,
  project_manager_id,
  documentation_links,
  status = 'active',
  project_number = `P${Date.now()}`,
  location = 'Default Location',
  fte_count = 1
}) => {
  const result = await pool.query(
    `INSERT INTO projects (
      name, project_number, start_date, end_date, location,
      fte_count, project_manager_id, documentation_links, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      name,
      project_number,
      start_date,
      end_date,
      location,
      fte_count,
      project_manager_id,
      documentation_links,
      status
    ]
  );
  return result.rows[0];
};

/**
 * Update project
 */
export const updateProject = async (id, {
  name,
  start_date,
  end_date,
  project_manager_id,
  documentation_links,
  status,
  project_number,
  location,
  fte_count
}) => {
  const result = await pool.query(
    `UPDATE projects 
     SET name = $1,
         project_number = $2,
         start_date = $3,
         end_date = $4,
         location = $5,
         fte_count = $6,
         project_manager_id = $7,
         documentation_links = $8,
         status = $9,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING *`,
    [
      name,
      project_number,
      start_date,
      end_date,
      location,
      fte_count,
      project_manager_id,
      documentation_links,
      status,
      id
    ]
  );
  return result.rows[0];
};

/**
 * Archive project
 */
export const archiveProject = async (id) => {
  const result = await pool.query(
    'UPDATE projects SET status = $1 WHERE id = $2 RETURNING *',
    ['archived', id]
  );
  return result.rows[0];
};

/**
 * Delete project
 */
export const deleteProject = async (id) => {
  const result = await pool.query(
    'DELETE FROM projects WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

/**
 * Get project assignments
 */
export const getProjectAssignments = async (projectId) => {
  const result = await pool.query(
    `SELECT pa.*, e.name as employee_name, e.position
     FROM project_assignments pa
     JOIN employees e ON e.id = pa.employee_id
     WHERE pa.project_id = $1
     ORDER BY pa.start_date ASC`,
    [projectId]
  );
  return result.rows;
};

/**
 * Get project workload summary
 */
export const getProjectWorkload = async (projectId) => {
  const result = await pool.query(
    `SELECT 
       SUM(allocation_percentage) as total_allocation,
       COUNT(DISTINCT employee_id) as assigned_employees,
       p.fte_count as required_fte
     FROM project_assignments pa
     JOIN projects p ON p.id = pa.project_id
     WHERE pa.project_id = $1 AND pa.status = 'active'
     GROUP BY p.fte_count`,
    [projectId]
  );
  return result.rows[0] || { total_allocation: 0, assigned_employees: 0, required_fte: 0 };
};