import { BaseRepository } from './base.repository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';

/**
 * Repository for managing user data in the database
 */
export class UserRepository extends BaseRepository {
  constructor(client = null) {
    super('users');
    this.client = client;
  }

  /**
   * Create a new user
   * @param {Object} userData User data to insert
   * @param {string} userData.email User's email
   * @param {string} userData.password Hashed password
   * @param {string} userData.name User's name
   * @param {string} userData.role User's role
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    const { email, password, name, role = 'user' } = userData;
    const result = await this.executeQuery(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, password, name, role]
    );
    return result.rows[0];
  }

  /**
   * Find a user by their email
   * @param {string} email User's email
   * @returns {Promise<Object>} User object
   */
  async findByEmail(email) {
    const result = await this.executeQuery(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('User', `email: ${email}`);
    }

    return result.rows[0];
  }

  /**
   * Find a user by their ID
   * @param {number} id User's ID
   * @returns {Promise<Object>} User object
   */
  async findById(id) {
    const result = await this.executeQuery(
      'SELECT id, email, name, role, last_login, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('User', id);
    }

    return result.rows[0];
  }

  /**
   * Update user's last login timestamp
   * @param {number} id User's ID
   * @returns {Promise<Object>} Updated user object
   */
  async updateLastLogin(id) {
    const result = await this.executeQuery(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, name, role, last_login',
      [id]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('User', id);
    }

    return result.rows[0];
  }

  /**
   * Update user data
   * @param {number} id User's ID
   * @param {Object} updateData Data to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(id, updateData) {
    const allowedUpdates = ['email', 'password', 'name', 'role'];
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
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING id, email, name, role, last_login, updated_at`,
      [id, ...values]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('User', id);
    }

    return result.rows[0];
  }

  /**
   * Delete a user
   * @param {number} id User's ID
   * @returns {Promise<void>}
   */
  async deleteUser(id) {
    const result = await this.executeQuery(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows[0]) {
      throw new NotFoundError('User', id);
    }
  }

  /**
   * List users with pagination
   * @param {Object} options Pagination options
   * @param {number} options.limit Maximum number of users to return
   * @param {number} options.offset Number of users to skip
   * @returns {Promise<Object>} Object containing users and count
   */
  async listUsers({ limit = 10, offset = 0 } = {}) {
    const countResult = await this.executeQuery('SELECT COUNT(*) FROM users');
    const totalCount = parseInt(countResult.rows[0].count);

    const users = await this.executeQuery(
      'SELECT id, email, name, role, last_login, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return {
      users: users.rows,
      totalCount,
      hasMore: totalCount > offset + limit
    };
  }
}