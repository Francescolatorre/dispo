const AssignmentService = require('../assignmentService');
const WorkloadService = require('../workloadService');
const { pool } = require('../../config/database');

jest.mock('../../config/database', () => ({
  pool: {
    connect: jest.fn()
  }
}));

jest.mock('../workloadService', () => ({
  validateAssignment: jest.fn(),
  calculateWorkload: jest.fn()
}));

describe('AssignmentService', () => {
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

  describe('createAssignment', () => {
    const validAssignmentData = {
      project_id: 1,
      employee_id: 1,
      requirement_id: 1,
      role: 'Developer',
      start_date: '2024-03-01',
      end_date: '2024-03-31',
      allocation_percentage: 50,
      dr_status: 'DR1',
      position_status: 'P1'
    };

    it('should create assignment when workload is valid', async () => {
      // Mock workload validation
      WorkloadService.validateAssignment.mockResolvedValue({
        valid: true,
        warning: false
      });

      // Mock successful assignment creation
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...validAssignmentData, id: 1 }]
      });

      const result = await AssignmentService.createAssignment(validAssignmentData);

      expect(result).toHaveProperty('id', 1);
      expect(WorkloadService.validateAssignment).toHaveBeenCalledWith(
        validAssignmentData.employee_id,
        validAssignmentData.start_date,
        validAssignmentData.end_date,
        validAssignmentData.allocation_percentage
      );
    });

    it('should fail when workload validation fails', async () => {
      WorkloadService.validateAssignment.mockResolvedValue({
        valid: false,
        warning: false,
        message: 'Total workload would exceed 100%'
      });

      await expect(
        AssignmentService.createAssignment(validAssignmentData)
      ).rejects.toThrow('Total workload would exceed 100%');

      expect(mockClient.query).not.toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO project_assignments/),
        expect.any(Array)
      );
    });

    it('should create assignment with warning flag', async () => {
      WorkloadService.validateAssignment.mockResolvedValue({
        valid: true,
        warning: true,
        message: 'High workload warning (>80%)'
      });

      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...validAssignmentData, id: 1, workload_warning: true }]
      });

      const result = await AssignmentService.createAssignment(validAssignmentData);

      expect(result.workload_warning).toBe(true);
    });
  });

  describe('getProjectAssignments', () => {
    it('should return assignments with workload information', async () => {
      // Mock assignments query
      mockClient.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            employee_id: 1,
            start_date: '2024-03-01',
            end_date: '2024-03-31'
          }
        ]
      });

      // Mock workload calculation
      WorkloadService.calculateWorkload.mockResolvedValue([
        { date: '2024-03-01', totalWorkload: 80 }
      ]);

      const result = await AssignmentService.getProjectAssignments(1);

      expect(result[0]).toHaveProperty('totalWorkload', 80);
      expect(WorkloadService.calculateWorkload).toHaveBeenCalledWith(
        1,
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('updateAssignment', () => {
    it('should validate workload when updating allocation', async () => {
      // Mock current assignment
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            employee_id: 1,
            start_date: '2024-03-01',
            end_date: '2024-03-31',
            allocation_percentage: 50
          }]
        })
        // Mock update query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            allocation_percentage: 70,
            workload_warning: true
          }]
        });

      WorkloadService.validateAssignment.mockResolvedValue({
        valid: true,
        warning: true,
        message: 'High workload warning (>80%)'
      });

      const result = await AssignmentService.updateAssignment(1, {
        allocation_percentage: 70
      });

      expect(result.workload_warning).toBe(true);
      expect(WorkloadService.validateAssignment).toHaveBeenCalled();
    });

    it('should not validate workload when updating non-workload fields', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          role: 'Senior Developer'
        }]
      });

      const result = await AssignmentService.updateAssignment(1, {
        role: 'Senior Developer'
      });

      expect(WorkloadService.validateAssignment).not.toHaveBeenCalled();
    });
  });
});