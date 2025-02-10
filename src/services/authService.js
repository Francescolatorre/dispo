import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * Create a new user account
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   * @param {string} role 
   * @returns {Promise<{id: string, email: string, name: string, role: string}>}
   */
  async createUser(email, password, name, role = 'user') {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, role]
    );
    
    return result.rows[0];
  }

  /**
   * Validate user credentials and return user data with token
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{user: {id: string, email: string, name: string, role: string}, token: string}>}
   */
  async login(email, password) {
    const result = await pool.query(
      'SELECT id, email, name, password, role FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last_login timestamp
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = this.generateToken(user);
    const { password: _, ...userData } = user;

    return {
      user: userData,
      token
    };
  }

  /**
   * Validate a JWT token
   * @param {string} token 
   * @returns {Promise<boolean>}
   */
  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [decoded.userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a JWT token for a user
   * @param {{id: string, email: string, name: string, role: string}} user 
   * @returns {string}
   */
  generateToken(user) {
    return jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  /**
   * Change user password
   * @param {string} userId 
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Invalid current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );
  }
}