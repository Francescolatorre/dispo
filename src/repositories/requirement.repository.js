import { BaseRepository } from './base.repository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';

/**
 * Repository for managing project requirements in the database
 */
export class RequirementRepository extends BaseRepository {
  constructor(client = null) {
    super('project_requirements');
    this.client = client;
  }

  /**
   * Get SQL for creating requirements table
   * @returns {string} Table creation SQL
   */
  getSchemaSQL() {
    return `
      CREATE TABLE IF NOT EXISTS project_requirements (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        role VARCHAR(100) NOT NULL,
        seniority_level VARCHAR(50) NOT NULL,
        required_qualifications TEXT[] NOT NULL DEFAULT '{}',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        notes TEXT,
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
      DROP TRIGGER IF EXISTS update_requirements_updated_at ON project_requirements;
      CREATE TRIGGER update_requirements_updated_at
        BEFORE UPDATE ON project_requirements
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_requirements_project 
        ON project_requirements(project_id);

      CREATE INDEX IF NOT EXISTS idx_requirements_status 
        ON project_requirements(status);

      CREATE INDEX IF NOT EXISTS idx_requirements_dates 
        ON project_requirements(start_date, end_date);

      -- Create trigger function to validate dates against project timeline
      CREATE OR REPLACE FUNCTION validate_requirement_dates()
      RETURNS TRIGGER AS $$
      DECLARE
        project_start DATE;
        project_end DATE;
      BEGIN
        SELECT start_date, end_date INTO project_start, project_end
        FROM projects WHERE id = NEW.project_id;

        IF NEW.start_date < project_start OR NEW.end_date > project_end THEN
          RAISE EXCEPTION 'Requirement dates must fall within project timeline';
        END IF;

        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger for date validation
      DROP TRIGGER IF EXISTS validate_requirement_dates_trigger ON project_requirements;
      CREATE TRIGGER validate_requirement_dates_trigger
        BEFORE INSERT OR UPDATE ON project_requirements
        FOR EACH ROW
        EXECUTE FUNCTION validate_requirement_dates();
    `;
  }

  /**
   * Create a new requirement
   * @param {Object} requirementData Requirement data to insert
   * @returns {Promise<Object>} Created requirement object
   */
  async createRequirement(requirementData) {
    try {
      const result = await this.executeQuery(
        `INSERT INTO project_requirements (
          project_id,
          role,
          seniority_level,
          required_qualifications,
          start_date,
          end_date,
          status,
          priority,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        Object.values(requirementData)
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find a requirement by ID
   * @param {number} id Requirement ID
   * @returns {Promise<Object>} Requirement object
   */
  async findById(id) {
    const result = await this.executeQuery(
      'SELECT * FROM project_requirements WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('Requirement', id);
    }

    return result.rows[0];
  }

  /**
   * Update requirement data
   * @param {number} id Requirement ID
   * @param {Object} updateData Data to update
   * @returns {Promise<Object>} Updated requirement object
   */
  async updateRequirement(id, updateData) {
    const allowedUpdates = [
      'role',
      'seniority_level',
      'required_qualifications',
      'start_date',
      'end_date',
      'status',
      'priority',
      'notes'
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

    const result = await this.executeQuery(
      `UPDATE project_requirements SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('Requirement', id);
    }

    return result.rows[0];
  }

  /**
   * Delete a requirement
   * @param {number} id Requirement ID
   * @returns {Promise<void>}
   */
  async deleteRequirement(id) {
    const result = await this.executeQuery(
      'DELETE FROM project_requirements WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('Requirement', id);
    }
  }

  /**
   * List requirements with pagination
   * @param {Object} options Pagination options
   * @param {number} options.limit Maximum number of requirements to return
   * @param {number} options.offset Number of requirements to skip
   * @param {number} [options.projectId] Optional project ID to filter by
   * @returns {Promise<Object>} Object containing requirements and count
   */
  async listRequirements({ limit = 10, offset = 0, projectId } = {}) {
    let whereClause = '';
    const params = [limit, offset];

    if (projectId) {
      whereClause = 'WHERE project_id = $3';
      params.push(projectId);
    }

    const countResult = await this.executeQuery(
      `SELECT COUNT(*) FROM project_requirements ${whereClause}`,
      projectId ? [projectId] : []
    );
    const totalCount = parseInt(countResult.rows[0].count);

    const requirements = await this.executeQuery(
      `SELECT * FROM project_requirements ${whereClause} 
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      params
    );

    return {
      requirements: requirements.rows,
      totalCount,
      hasMore: totalCount > offset + limit
    };
  }
}