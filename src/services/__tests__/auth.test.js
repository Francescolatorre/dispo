import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthService } from '../authService.js';
import { UserRepository } from '../../repositories/user.repository.js';
import { AuthorizationError, ValidationError, NotFoundError } from '../../errors/index.js';

// Mock UserRepository
vi.mock('../../repositories/user.repository.js');

// Set up test environment
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

describe('AuthService', () => {
  let authService;
  let userRepository;
  let testCount = 0;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Create a fresh mock repository for each test
    userRepository = new UserRepository();
    userRepository.withTransaction = vi.fn(callback => callback());
    
    // Create a new service instance with the mock repository
    authService = new AuthService(userRepository);
    testCount++;
  });

  const getUniqueEmail = () => `test${testCount}@example.com`;

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const email = getUniqueEmail();
      const password = 'password123';
      const name = 'Test User';
      const role = 'user';

      const mockUser = {
        id: 1,
        email,
        name,
        role,
        created_at: new Date()
      };

      userRepository.createUser = vi.fn().mockResolvedValue(mockUser);

      const user = await authService.createUser(email, password, name, role);

      expect(userRepository.createUser).toHaveBeenCalledWith({
        email,
        password: expect.stringMatching(/^\$2b\$\d+\$/), // bcrypt hash pattern
        name,
        role
      });

      expect(user).toEqual(mockUser);
    });

    it('should use transaction for user creation', async () => {
      const email = getUniqueEmail();
      userRepository.createUser = vi.fn().mockResolvedValue({ id: 1, email });

      await authService.createUser(email, 'password', 'name');

      expect(userRepository.withTransaction).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return user data and token for valid credentials', async () => {
      const email = getUniqueEmail();
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const mockUser = {
        id: 1,
        email,
        name: 'Test User',
        role: 'user',
        password: hashedPassword
      };

      userRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);
      userRepository.updateLastLogin = vi.fn().mockResolvedValue({
        ...mockUser,
        last_login: new Date()
      });

      const result = await authService.login(email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(email);
      expect(result.user).not.toHaveProperty('password');
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw AuthorizationError for invalid password', async () => {
      const email = getUniqueEmail();
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      
      userRepository.findByEmail = vi.fn().mockResolvedValue({
        id: 1,
        email,
        password: hashedPassword
      });

      await expect(
        authService.login(email, 'wrong-password')
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw AuthorizationError for non-existent user', async () => {
      userRepository.findByEmail = vi.fn().mockRejectedValue(
        new NotFoundError('User', 'email')
      );

      await expect(
        authService.login('nonexistent@example.com', 'password')
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      const mockUser = {
        id: 1,
        email: getUniqueEmail()
      };

      userRepository.findById = vi.fn().mockResolvedValue(mockUser);

      const token = jwt.sign(
        { userId: mockUser.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const isValid = await authService.validateToken(token);
      expect(isValid).toBe(true);
      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw AuthorizationError for invalid token', async () => {
      await expect(
        authService.validateToken('invalid-token')
      ).rejects.toThrow(AuthorizationError);
    });

    it('should return false when user not found', async () => {
      userRepository.findById = vi.fn().mockRejectedValue(
        new NotFoundError('User', 1)
      );

      const token = jwt.sign(
        { userId: 1 },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const isValid = await authService.validateToken(token);
      expect(isValid).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      const userId = 1;
      const currentPassword = 'current-password';
      const newPassword = 'new-password';
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      const mockUser = {
        id: userId,
        password: hashedPassword
      };

      userRepository.findById = vi.fn().mockResolvedValue(mockUser);
      userRepository.updateUser = vi.fn().mockResolvedValue({
        ...mockUser,
        updated_at: new Date()
      });

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      expect(result).toHaveProperty('updated_at');
      expect(userRepository.updateUser).toHaveBeenCalledWith(
        userId,
        {
          password: expect.stringMatching(/^\$2b\$\d+\$/) // bcrypt hash pattern
        }
      );
    });

    it('should throw ValidationError when current password is incorrect', async () => {
      const userId = 1;
      const hashedPassword = await bcrypt.hash('correct-password', 10);

      userRepository.findById = vi.fn().mockResolvedValue({
        id: userId,
        password: hashedPassword
      });

      await expect(
        authService.changePassword(userId, 'wrong-password', 'new-password')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      userRepository.findById = vi.fn().mockRejectedValue(
        new NotFoundError('User', 999)
      );

      await expect(
        authService.changePassword(999, 'password', 'new-password')
      ).rejects.toThrow(NotFoundError);
    });

    it('should use transaction for password change', async () => {
      const userId = 1;
      const currentPassword = 'current-password';
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      userRepository.findById = vi.fn().mockResolvedValue({
        id: userId,
        password: hashedPassword
      });
      userRepository.updateUser = vi.fn().mockResolvedValue({
        id: userId,
        updated_at: new Date()
      });

      await authService.changePassword(userId, currentPassword, 'new-password');

      expect(userRepository.withTransaction).toHaveBeenCalled();
    });
  });
});