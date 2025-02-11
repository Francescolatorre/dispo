import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository.js';
import { AuthorizationError, ValidationError } from '../errors/index.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

/**
 * Service for handling authentication and user management
 */
export class AuthService {
  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  /**
   * Initialize auth service
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.info('Initializing auth service', {
      context: {
        service: 'AuthService',
        operation: 'initialize'
      }
    });

    try {
      await this.userRepository.initializeSchema();
      
      logger.info('Auth service initialized', {
        context: {
          service: 'AuthService',
          operation: 'initialize'
        }
      });
    } catch (error) {
      logger.error('Failed to initialize auth service', {
        error,
        context: {
          service: 'AuthService',
          operation: 'initialize'
        }
      });
      throw error;
    }
  }

  /**
   * Authenticate user and generate token
   * @param {string} email User's email
   * @param {string} password User's password
   * @returns {Promise<Object>} Authentication result with token and user
   */
  async login(email, password) {
    const startTime = process.hrtime();

    logger.info('Login attempt', {
      context: {
        email,
        service: 'AuthService',
        operation: 'login'
      }
    });

    try {
      // Find user and verify password
      const user = await this.userRepository.findByEmail(email);
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        metrics.increment('auth_failures', {
          labels: { reason: 'invalid_password' }
        });

        throw new AuthorizationError('Invalid credentials');
      }

      // Update last login within transaction
      const updatedUser = await this.userRepository.withTransaction(async () => {
        return this.userRepository.updateLastLogin(user.id);
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const duration = this._getDurationMs(startTime);
      metrics.observe('auth_duration', {
        value: duration,
        labels: { operation: 'login' }
      });

      logger.info('Login successful', {
        context: {
          userId: user.id,
          email: user.email,
          duration
        }
      });

      // Don't include password in response
      const { password: _, ...userWithoutPassword } = updatedUser;
      return { token, user: userWithoutPassword };
    } catch (error) {
      const duration = this._getDurationMs(startTime);
      metrics.increment('auth_errors', {
        labels: {
          operation: 'login',
          error: error.name
        }
      });

      logger.error('Login failed', {
        error,
        context: {
          email,
          duration,
          service: 'AuthService',
          operation: 'login'
        }
      });

      throw error;
    }
  }

  /**
   * Validate JWT token
   * @param {string} token JWT token
   * @returns {Promise<boolean>} True if token is valid
   */
  async validateToken(token) {
    const startTime = process.hrtime();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await this.userRepository.findById(decoded.userId);

      const duration = this._getDurationMs(startTime);
      metrics.observe('auth_duration', {
        value: duration,
        labels: { operation: 'validate_token' }
      });

      logger.debug('Token validated successfully', {
        context: {
          userId: user.id,
          duration
        }
      });

      return true;
    } catch (error) {
      const duration = this._getDurationMs(startTime);
      metrics.increment('auth_errors', {
        labels: {
          operation: 'validate_token',
          error: error.name
        }
      });

      logger.warn('Token validation failed', {
        error,
        context: {
          duration,
          service: 'AuthService',
          operation: 'validateToken'
        }
      });

      return false;
    }
  }

  /**
   * Change user's password
   * @param {number} userId User's ID
   * @param {string} currentPassword Current password
   * @param {string} newPassword New password
   * @returns {Promise<Object>} Updated user object
   */
  async changePassword(userId, currentPassword, newPassword) {
    const startTime = process.hrtime();

    logger.info('Password change attempt', {
      context: {
        userId,
        service: 'AuthService',
        operation: 'changePassword'
      }
    });

    try {
      // Verify current password
      const user = await this.userRepository.findById(userId);
      const isValid = await bcrypt.compare(currentPassword, user.password);

      if (!isValid) {
        throw new ValidationError('Invalid current password');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password within transaction
      const updatedUser = await this.userRepository.withTransaction(async () => {
        return this.userRepository.updateUser(userId, {
          password: hashedPassword
        });
      });

      const duration = this._getDurationMs(startTime);
      metrics.observe('auth_duration', {
        value: duration,
        labels: { operation: 'change_password' }
      });

      logger.info('Password changed successfully', {
        context: {
          userId,
          duration
        }
      });

      return updatedUser;
    } catch (error) {
      const duration = this._getDurationMs(startTime);
      metrics.increment('auth_errors', {
        labels: {
          operation: 'change_password',
          error: error.name
        }
      });

      logger.error('Password change failed', {
        error,
        context: {
          userId,
          duration,
          service: 'AuthService',
          operation: 'changePassword'
        }
      });

      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {number} userId User's ID
   * @returns {Promise<Object>} User object
   */
  async findUserById(userId) {
    const user = await this.userRepository.findById(userId);
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get duration in milliseconds
   * @param {[number, number]} startTime Start time from process.hrtime()
   * @returns {number} Duration in milliseconds
   */
  _getDurationMs(startTime) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    return seconds * 1000 + nanoseconds / 1000000;
  }
}