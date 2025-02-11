import { BaseRepository } from './base.repository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';

/**
 * Repository for managing project data in the database
 */
export class ProjectRepository extends BaseRepository {
  constructor(client = null) {
    super('projects');
    this.client = client;
  }

  /**
   * Get SQL for creating projects table
   * @returns {string} Table creation SQL
   */
  getSchemaSQL() {
    return `
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        project_number VARCHAR(50) UNIQUE NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        location VARCHAR(100) NOT NULL,
        fte_count INTEGER NOT NULL,
        project_manager_id INTEGER NOT NULL REFERENCES employees(id),
        documentation_links TEXT[] NOT NULL DEFAULT '{}',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CHECK (end_date >= start_date)
      )
    `;
  }

  /**
   * Get SQL for additional schema elements (triggers, indexes, etc.)
   * @returns {string} Additional schema SQL
   */
  getAdditionalSchemaSQL() {
    return `
      -- Create updated_at trigger function if it doesn't exist
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger for updated_at
      DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
      CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON projects
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Create sequence for project numbers if it doesn't exist
      CREATE SEQUENCE IF NOT EXISTS project_number_seq;

      -- Create index on project manager for quick lookups
      CREATE INDEX IF NOT EXISTS idx_projects_manager 
        ON projects(project_manager_id);

      -- Create index on status for filtering
      CREATE INDEX IF NOT EXISTS idx_projects_status 
        ON projects(status);

      -- Create index on date range for timeline queries
      CREATE INDEX IF NOT EXISTS idx_projects_dates 
        ON projects(start_date, end_date);
    `;
  }

  /**
   * Create a new project
   * @param {Object} projectData Project data to insert
   * @returns {Promise<Object>} Created project object
   */
  async createProject(projectData) {
    try {
      const result = await this.executeQuery(
        `INSERT INTO projects (
          name,
          project_number,
          start_date,
          end_date,
          location,
          fte_count,
          project_manager_id,
          documentation_links,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        Object.values(projectData)
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505' && error.constraint === 'projects_project_number_key') {
        throw new ConflictError('Project', 'project_number', projectData.project_number);
      }
      throw error;
    }
  }

  /**
   * Find a project by ID
   * @param {number} id Project ID
   * @returns {Promise<Object>} Project object
   */
  async findById(id) {
    const result = await this.executeQuery(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('Project', id);
    }

    return result.rows[0];
  }

  /**
   * Update project data
   * @param {number} id Project ID
   * @param {Object} updateData Data to update
   * @returns {Promise<Object>} Updated project object
   */
  async updateProject(id, updateData) {
    const allowedUpdates = [
      'name',
      'start_date',
      'end_date',
      'location',
      'fte_count',
      'project_manager_id',
      'documentation_links',
      'status'
    ];

    const updates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key) && updateData[key] !== undefined);

    if (updates.length === 0) {
      return this.findById(id);
    }

    const setClause = updates
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values = updates.map(key => updateData[key]);

    try {
      const result = await this.executeQuery(
        `UPDATE projects SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
      );

      if (!result.rows[0]) {
        throw new NotFoundError('Project', id);
      }

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505' && error.constraint === 'projects_project_number_key') {
        throw new ConflictError('Project', 'project_number', updateData.project_number);
      }
      throw error;
    }
  }

  /**
   * Delete a project
   * @param {number} id Project ID
   * @returns {Promise<void>}
   */
  async deleteProject(id) {
    const result = await this.executeQuery(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('Project', id);
    }
  }

  /**
   * List projects with pagination
   * @param {Object} options Pagination options
   * @param {number} options.limit Maximum number of projects to return
   * @param {number} options.offset Number of projects to skip
   * @returns {Promise<Object>} Object containing projects and count
   */
  async listProjects({ limit = 10, offset = 0 } = {}) {
    const countResult = await this.executeQuery('SELECT COUNT(*) FROM projects');
    const totalCount = parseInt(countResult.rows[0].count);

    const projects = await this.executeQuery(
      'SELECT * FROM projects ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return {
      projects: projects.rows,
      totalCount,
      hasMore: totalCount > offset + limit
    };
  }
}