import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { UserRepository } from '../user.repository.js';
import { ConflictError, NotFoundError } from '../../errors/index.js';
import pool from '../../config/database.js';
import { setupTestDb } from '../../db/setup-test-db.js';

describe('UserRepository', () => {
  let userRepository;
  let client;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query('BEGIN');
    userRepository = new UserRepository(client);
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    client.release();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        role: 'user'
      };

      const user = await userRepository.createUser(userData);

      expect(user).toEqual(expect.objectContaining({
        id: expect.any(Number),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        created_at: expect.any(Date)
      }));
    });

    it('should throw ConflictError for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        role: 'user'
      };

      await userRepository.createUser(userData);
      await expect(userRepository.createUser(userData))
        .rejects
        .toThrow(ConflictError);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'find@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        role: 'user'
      };

      const created = await userRepository.createUser(userData);
      const found = await userRepository.findByEmail(userData.email);

      expect(found).toEqual(expect.objectContaining({
        id: created.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      }));
    });

    it('should throw NotFoundError for non-existent email', async () => {
      await expect(userRepository.findByEmail('nonexistent@example.com'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const userData = {
        email: 'login@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        role: 'user'
      };

      const created = await userRepository.createUser(userData);
      const updated = await userRepository.updateLastLogin(created.id);

      expect(updated).toEqual(expect.objectContaining({
        id: created.id,
        email: userData.email,
        name: userData.name,
        last_login: expect.any(Date)
      }));
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(userRepository.updateLastLogin(999999))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const userData = {
        email: 'update@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        role: 'user'
      };

      const created = await userRepository.createUser(userData);
      const updateData = {
        email: 'updated@example.com',
        name: 'Updated User',
        role: 'admin'
      };

      const updated = await userRepository.updateUser(created.id, updateData);

      expect(updated).toEqual(expect.objectContaining({
        id: created.id,
        email: updateData.email,
        name: updateData.name,
        role: updateData.role
      }));
    });

    it('should throw ConflictError when updating to existing email', async () => {
      const user1 = await userRepository.createUser({
        email: 'user1@example.com',
        password: 'hashedPassword123',
        name: 'User One',
        role: 'user'
      });

      await userRepository.createUser({
        email: 'user2@example.com',
        password: 'hashedPassword123',
        name: 'User Two',
        role: 'user'
      });

      await expect(userRepository.updateUser(user1.id, { email: 'user2@example.com' }))
        .rejects
        .toThrow(ConflictError);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userData = {
        email: 'delete@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        role: 'user'
      };

      const created = await userRepository.createUser(userData);
      await userRepository.deleteUser(created.id);

      await expect(userRepository.findById(created.id))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(userRepository.deleteUser(999999))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('listUsers', () => {
    it('should list users with pagination', async () => {
      await Promise.all([
        userRepository.createUser({
          email: 'user1@example.com',
          password: 'hashedPassword123',
          name: 'User One',
          role: 'user'
        }),
        userRepository.createUser({
          email: 'user2@example.com',
          password: 'hashedPassword123',
          name: 'User Two',
          role: 'user'
        }),
        userRepository.createUser({
          email: 'user3@example.com',
          password: 'hashedPassword123',
          name: 'User Three',
          role: 'user'
        })
      ]);

      const { users, totalCount, hasMore } = await userRepository.listUsers({
        limit: 2,
        offset: 0
      });

      expect(users).toHaveLength(2);
      expect(totalCount).toBeGreaterThanOrEqual(3);
      expect(hasMore).toBe(true);
    });
  });

  describe('transaction support', () => {
    let transactionClient;
    let transactionRepo;

    beforeEach(async () => {
      transactionClient = await pool.connect();
      transactionRepo = new UserRepository(transactionClient);
    });

    afterEach(async () => {
      if (transactionClient) {
        await transactionClient.query('ROLLBACK');
        transactionClient.release();
      }
    });

    it('should rollback changes on error', async () => {
      const userData = {
        email: 'transaction@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        role: 'user'
      };

      await transactionClient.query('BEGIN');
      try {
        await transactionRepo.createUser(userData);
        throw new Error('Test error');
      } catch (error) {
        expect(error.message).toBe('Test error');
        await transactionClient.query('ROLLBACK');
      }

      // Use a new connection to verify the rollback
      const verifyRepo = new UserRepository();
      await expect(verifyRepo.findByEmail(userData.email))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should commit changes on success', async () => {
      const userData = {
        email: 'transaction-success@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        role: 'user'
      };

      await transactionClient.query('BEGIN');
      await transactionRepo.createUser(userData);
      await transactionClient.query('COMMIT');

      // Use a new connection to verify the commit
      const verifyRepo = new UserRepository();
      const user = await verifyRepo.findByEmail(userData.email);
      expect(user.email).toBe(userData.email);
    });
  });
});