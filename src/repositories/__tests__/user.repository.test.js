import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import bcrypt from 'bcrypt';
import { UserRepository } from '../user.repository.js';
import { testDb, createTestTransaction } from '../../routes/__tests__/setup.js';
import { ConflictError, NotFoundError } from '../../errors/index.js';

describe('UserRepository', () => {
  let userRepository;
  let client;
  let testCount = 0;

  const getUniqueEmail = () => `test${testCount}@example.com`;

  beforeAll(async () => {
    await testDb.setup();
  });

  beforeEach(async () => {
    client = await createTestTransaction();
    userRepository = new UserRepository(client);
    testCount++;
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    await client.release();
  });

  describe('CRUD Operations', () => {
    describe('createUser', () => {
      it('should create user with valid data', async () => {
        const userData = {
          email: getUniqueEmail(),
          password: await bcrypt.hash('testpass123', 10),
          name: 'Test User',
          role: 'user'
        };

        const user = await userRepository.createUser(userData);

        expect(user).toBeDefined();
        expect(user.email).toBe(userData.email);
        expect(user.name).toBe(userData.name);
        expect(user.role).toBe(userData.role);
        expect(user.id).toBeDefined();
        expect(user.created_at).toBeDefined();
        // Password should not be returned
        expect(user.password).toBeUndefined();
      });

      it('should set default role if not provided', async () => {
        const userData = {
          email: getUniqueEmail(),
          password: await bcrypt.hash('testpass123', 10),
          name: 'Test User'
        };

        const user = await userRepository.createUser(userData);

        expect(user.role).toBe('user');
      });

      it('should handle duplicate email', async () => {
        const email = getUniqueEmail();
        const userData = {
          email,
          password: await bcrypt.hash('testpass123', 10),
          name: 'Test User'
        };

        await userRepository.createUser(userData);

        await expect(userRepository.createUser(userData))
          .rejects
          .toThrow(ConflictError);
      });
    });

    describe('findByEmail', () => {
      it('should find existing user', async () => {
        const userData = {
          email: getUniqueEmail(),
          password: await bcrypt.hash('testpass123', 10),
          name: 'Test User'
        };

        const created = await userRepository.createUser(userData);
        const found = await userRepository.findByEmail(userData.email);

        expect(found.id).toBe(created.id);
        expect(found.email).toBe(created.email);
        expect(found.name).toBe(created.name);
        // Password should be included for auth
        expect(found.password).toBeDefined();
      });

      it('should throw NotFoundError for non-existent email', async () => {
        await expect(userRepository.findByEmail('nonexistent@example.com'))
          .rejects
          .toThrow(NotFoundError);
      });
    });

    describe('findById', () => {
      it('should find existing user', async () => {
        const userData = {
          email: getUniqueEmail(),
          password: await bcrypt.hash('testpass123', 10),
          name: 'Test User'
        };

        const created = await userRepository.createUser(userData);
        const found = await userRepository.findById(created.id);

        expect(found.id).toBe(created.id);
        expect(found.email).toBe(created.email);
        expect(found.name).toBe(created.name);
        // Password should not be returned
        expect(found.password).toBeUndefined();
      });

      it('should throw NotFoundError for non-existent ID', async () => {
        await expect(userRepository.findById(99999))
          .rejects
          .toThrow(NotFoundError);
      });
    });

    describe('updateUser', () => {
      it('should update allowed fields', async () => {
        const userData = {
          email: getUniqueEmail(),
          password: await bcrypt.hash('testpass123', 10),
          name: 'Test User'
        };

        const created = await userRepository.createUser(userData);
        const updateData = {
          name: 'Updated Name',
          email: getUniqueEmail()
        };

        const updated = await userRepository.updateUser(created.id, updateData);

        expect(updated.name).toBe(updateData.name);
        expect(updated.email).toBe(updateData.email);
        expect(updated.updated_at).toBeDefined();
      });

      it('should ignore non-allowed fields', async () => {
        const userData = {
          email: getUniqueEmail(),
          password: await bcrypt.hash('testpass123', 10),
          name: 'Test User'
        };

        const created = await userRepository.createUser(userData);
        const updateData = {
          name: 'Updated Name',
          nonexistent_field: 'should be ignored'
        };

        const updated = await userRepository.updateUser(created.id, updateData);

        expect(updated.name).toBe(updateData.name);
        expect(updated.email).toBe(created.email);
      });

      it('should throw NotFoundError for non-existent user', async () => {
        await expect(userRepository.updateUser(99999, { name: 'Test' }))
          .rejects
          .toThrow(NotFoundError);
      });
    });

    describe('deleteUser', () => {
      it('should delete existing user', async () => {
        const userData = {
          email: getUniqueEmail(),
          password: await bcrypt.hash('testpass123', 10),
          name: 'Test User'
        };

        const created = await userRepository.createUser(userData);
        await userRepository.deleteUser(created.id);

        await expect(userRepository.findById(created.id))
          .rejects
          .toThrow(NotFoundError);
      });

      it('should throw NotFoundError for non-existent user', async () => {
        await expect(userRepository.deleteUser(99999))
          .rejects
          .toThrow(NotFoundError);
      });
    });

    describe('listUsers', () => {
      it('should return paginated results', async () => {
        // Create multiple users
        const users = await Promise.all(
          Array(15).fill().map((_, i) => userRepository.createUser({
            email: getUniqueEmail(),
            password: 'testpass123',
            name: `Test User ${i}`
          }))
        );

        const result = await userRepository.listUsers({ limit: 10, offset: 0 });

        expect(result.users).toHaveLength(10);
        expect(result.totalCount).toBeGreaterThanOrEqual(15);
        expect(result.hasMore).toBe(true);
      });

      it('should handle empty result set', async () => {
        const result = await userRepository.listUsers({ limit: 10, offset: 1000 });

        expect(result.users).toHaveLength(0);
        expect(result.hasMore).toBe(false);
      });

      it('should calculate hasMore correctly', async () => {
        // Create exactly 10 users
        await Promise.all(
          Array(10).fill().map(() => userRepository.createUser({
            email: getUniqueEmail(),
            password: 'testpass123',
            name: 'Test User'
          }))
        );

        const result = await userRepository.listUsers({ limit: 10, offset: 0 });

        expect(result.users).toHaveLength(10);
        expect(result.hasMore).toBe(false);
      });
    });
  });

  describe('Special Operations', () => {
    describe('updateLastLogin', () => {
      it('should update timestamp', async () => {
        const userData = {
          email: getUniqueEmail(),
          password: await bcrypt.hash('testpass123', 10),
          name: 'Test User'
        };

        const created = await userRepository.createUser(userData);
        const updated = await userRepository.updateLastLogin(created.id);

        expect(updated.last_login).toBeDefined();
        expect(new Date(updated.last_login).getTime())
          .toBeGreaterThan(new Date(created.created_at).getTime());
      });

      it('should throw NotFoundError for non-existent user', async () => {
        await expect(userRepository.updateLastLogin(99999))
          .rejects
          .toThrow(NotFoundError);
      });
    });
  });

  describe('Transaction Handling', () => {
    it('should rollback on error', async () => {
      const userData = {
        email: getUniqueEmail(),
        password: await bcrypt.hash('testpass123', 10),
        name: 'Test User'
      };

      // Create user successfully
      const created = await userRepository.createUser(userData);

      // Try to create another user with same email (should fail)
      try {
        await userRepository.createUser(userData);
      } catch (error) {
        // Expected error
      }

      // Verify the user still exists (transaction didn't affect it)
      const found = await userRepository.findById(created.id);
      expect(found.id).toBe(created.id);
    });

    it('should maintain isolation', async () => {
      const userData = {
        email: getUniqueEmail(),
        password: await bcrypt.hash('testpass123', 10),
        name: 'Test User'
      };

      // Create user in transaction
      const created = await userRepository.createUser(userData);

      // Try to find user from another connection (should not be visible)
      const otherClient = await createTestTransaction();
      const otherRepo = new UserRepository(otherClient);

      await expect(otherRepo.findById(created.id))
        .rejects
        .toThrow(NotFoundError);

      await otherClient.query('ROLLBACK');
      await otherClient.release();
    });
  });
});