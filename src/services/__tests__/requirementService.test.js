const requirementService = require('../requirementService');
const { pool } = require('../../config/database');

// Mock the database pool
jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('RequirementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRequirement', () => {
    it('should create a new requirement', async () => {
      const mockRequirement = { id: 1, project_id: 1, role: 'Developer' };
      pool.query.mockResolvedValue({ rows: [mockRequirement] });

      const data = {
        project_id: 1,
        role: 'Developer',
        seniority_level: 'Senior',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      };

      const result = await requirementService.createRequirement(data);
      expect(result).toEqual(mockRequirement);
    });
  });

  describe('getRequirementById', () => {
    it('should return requirement by id', async () => {
      const mockRequirement = { id: 1, role: 'Developer' };
      pool.query.mockResolvedValue({ rows: [mockRequirement] });

      const result = await requirementService.getRequirementById(1);
      expect(result).toEqual(mockRequirement);
    });

    it('should return null if not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await requirementService.getRequirementById(999);
      expect(result).toBeNull();
    });
  });

  describe('getProjectRequirements', () => {
    it('should return all requirements for a project', async () => {
      const mockRequirements = [{ id: 1 }, { id: 2 }];
      pool.query.mockResolvedValue({ rows: mockRequirements });

      const result = await requirementService.getProjectRequirements(1);
      expect(result).toEqual(mockRequirements);
    });
  });

  describe('updateRequirement', () => {
    it('should update requirement', async () => {
      const mockRequirement = { id: 1, role: 'Updated' };
      pool.query.mockResolvedValue({ rows: [mockRequirement] });

      const result = await requirementService.updateRequirement(1, { role: 'Updated' });
      expect(result).toEqual(mockRequirement);
    });
  });

  describe('deleteRequirement', () => {
    it('should delete requirement', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });
      const result = await requirementService.deleteRequirement(1);
      expect(result).toBe(true);
    });
  });
});
