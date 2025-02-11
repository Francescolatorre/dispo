import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthorizationError, ValidationError } from '../errors/index.js';
import { UserRepository } from '../repositories/user.repository.js';

const SALT_ROUNDS = 10;

export class AuthService {
  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

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
    
    return await this.userRepository.withTransaction(async () => {
      return await this.userRepository.createUser({
        email,
        password: hashedPassword,
        name,
        role
      });
    });
  }

  /**
   * Validate user credentials and return user data with token
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{user: {id: string, email: string, name: string, role: string}, token: string}>}
   */
  async login(email, password) {
    return await this.userRepository.withTransaction(async () => {
      try {
        const user = await this.userRepository.findByEmail(email);
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new AuthorizationError('Invalid credentials');
        }

        const updatedUser = await this.userRepository.updateLastLogin(user.id);
        const { password: _, ...userData } = updatedUser;
        const token = this.generateToken(userData);

        return {
          user: userData,
          token
        };
      } catch (error) {
        if (error.name === 'NotFoundError') {
          throw new AuthorizationError('Invalid credentials');
        }
        throw error;
      }
    });
  }

  /**
   * Validate a JWT token
   * @param {string} token 
   * @returns {Promise<boolean>}
   */
  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user exists and is active
      await this.userRepository.findById(decoded.userId);
      return true;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthorizationError('Invalid token');
      }
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
   * @returns {Promise<{updated_at: Date}>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    return await this.userRepository.withTransaction(async () => {
      const user = await this.userRepository.findById(userId);

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw new ValidationError('Invalid current password', 'currentPassword');
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      const updatedUser = await this.userRepository.updateUser(userId, {
        password: hashedPassword
      });

      return {
        updated_at: updatedUser.updated_at
      };
    });
  }
}