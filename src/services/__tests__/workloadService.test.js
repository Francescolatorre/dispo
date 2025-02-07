const WorkloadService = require('../workloadService');
const { pool } = require('../../config/database');

jest.mock('../../config/database', () => ({
  pool: {
    connect: jest.fn()
  }
}));

describe('WorkloadService', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateWorkload', () => {
    it('should calculate correct workload for single assignment', async () => {
      // Mock employee data
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            work_time_factor: 1.0,
            part_time_factor: 100
          }]
        })
        // Mock assignment data
        .mockResolvedValueOnce({
          rows: [{
            project_id: 1,
            project_name: 'Test Project',
            allocation_percentage: 50,
            start_date: '2024-03-01',
            end_date: '2024-03-31'
          }]
        });

      const result = await WorkloadService.calculateWorkload(
        1,
        new Date('2024-03-01'),
        new Date('2024-03-03')
      );

      expect(result).toHaveLength(3); // 3 days
      expect(result[0]).toEqual({
        date: expect.any(Date),
        totalWorkload: 50,
        assignments: [{
          projectId: 1,
          projectName: 'Test Project',
          allocation: 50
        }]
      });
    });

    it('should handle part-time employee workload', async () => {
      // Mock employee data with 80% part-time
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            work_time_factor: 1.0,
            part_time_factor: 80
          }]
        })
        // Mock assignment data
        .mockResolvedValueOnce({
          rows: [{
            project_id: 1,
            project_name: 'Test Project',
            allocation_percentage: 100,
            start_date: '2024-03-01',
            end_date: '2024-03-31'
          }]
        });

      const result = await WorkloadService.calculateWorkload(
        1,
        new Date('2024-03-01'),
        new Date('2024-03-01')
      );

      expect(result[0].totalWorkload).toBe(80); // 100% allocation * 0.8 part-time
    });

    it('should handle multiple overlapping assignments', async () => {
      // Mock employee data
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            work_time_factor: 1.0,
            part_time_factor: 100
          }]
        })
        // Mock assignments data
        .mockResolvedValueOnce({
          rows: [
            {
              project_id: 1,
              project_name: 'Project A',
              allocation_percentage: 50,
              start_date: '2024-03-01',
              end_date: '2024-03-31'
            },
            {
              project_id: 2,
              project_name: 'Project B',
              allocation_percentage: 30,
              start_date: '2024-03-01',
              end_date: '2024-03-15'
            }
          ]
        });

      const result = await WorkloadService.calculateWorkload(
        1,
        new Date('2024-03-01'),
        new Date('2024-03-01')
      );

      expect(result[0].totalWorkload).toBe(80); // 50% + 30%
      expect(result[0].assignments).toHaveLength(2);
    });

    it('should throw error for non-existent employee', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        WorkloadService.calculateWorkload(
          999,
          new Date('2024-03-01'),
          new Date('2024-03-01')
        )
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('validateAssignment', () => {
    it('should validate allocation steps of 10%', async () => {
      const result = await WorkloadService.validateAssignment(
        1,
        new Date('2024-03-01'),
        new Date('2024-03-31'),
        45 // Not a multiple of 10
      );

      expect(result).toEqual({
        valid: false,
        warning: false,
        message: 'Allocation must be in steps of 10%'
      });
    });

    it('should detect overallocation', async () => {
      // Mock existing 80% workload
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            work_time_factor: 1.0,
            part_time_factor: 100
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            project_id: 1,
            project_name: 'Existing Project',
            allocation_percentage: 80,
            start_date: '2024-03-01',
            end_date: '2024-03-31'
          }]
        });

      const result = await WorkloadService.validateAssignment(
        1,
        new Date('2024-03-01'),
        new Date('2024-03-31'),
        30 // Would result in 110%
      );

      expect(result).toEqual({
        valid: false,
        warning: false,
        message: 'Total workload would exceed 100%: 110%'
      });
    });

    it('should warn for high workload', async () => {
      // Mock existing 70% workload
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            work_time_factor: 1.0,
            part_time_factor: 100
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            project_id: 1,
            project_name: 'Existing Project',
            allocation_percentage: 70,
            start_date: '2024-03-01',
            end_date: '2024-03-31'
          }]
        });

      const result = await WorkloadService.validateAssignment(
        1,
        new Date('2024-03-01'),
        new Date('2024-03-31'),
        20 // Would result in 90%
      );

      expect(result).toEqual({
        valid: true,
        warning: true,
        message: 'High workload warning (>80%)'
      });
    });
  });
});