import { assignmentService } from '../assignmentService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AssignmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAssignments', () => {
    it('should fetch all assignments', async () => {
      const mockAssignments = [{ id: 1, employee_id: 1, project_id: 1 }];
      mockedAxios.get.mockResolvedValue({ data: mockAssignments });

      const result = await assignmentService.getAssignments();

      expect(result).toEqual(mockAssignments);
    });
  });

  describe('getProjectAssignments', () => {
    it('should fetch assignments for a project', async () => {
      const mockAssignments = [{ id: 1, project_id: 1 }];
      mockedAxios.get.mockResolvedValue({ data: mockAssignments });

      const result = await assignmentService.getProjectAssignments(1);

      expect(result).toEqual(mockAssignments);
    });
  });

  describe('createAssignment', () => {
    it('should create a new assignment', async () => {
      const newAssignment = { employee_id: 1, project_id: 1, role: 'Developer' };
      mockedAxios.post.mockResolvedValue({ data: newAssignment });

      const result = await assignmentService.createAssignment(newAssignment as any);

      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('updateAssignment', () => {
    it('should update an assignment', async () => {
      const updatedAssignment = { id: 1, role: 'Senior Developer' };
      mockedAxios.put.mockResolvedValue({ data: updatedAssignment });

      const result = await assignmentService.updateAssignment(1, { role: 'Senior Developer' } as any);

      expect(mockedAxios.put).toHaveBeenCalled();
    });
  });

  describe('deleteAssignment', () => {
    it('should delete an assignment', async () => {
      mockedAxios.delete.mockResolvedValue({ data: {} });

      await assignmentService.deleteAssignment(1);

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/assignments/1');
    });
  });
});
