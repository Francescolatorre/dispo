import { projectService } from '../projectService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should fetch all projects', async () => {
      const mockProjects = [{ id: 1, name: 'Project A' }];
      mockedAxios.get.mockResolvedValue({ data: mockProjects });

      const result = await projectService.getProjects();

      expect(result).toEqual(mockProjects);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/projects');
    });
  });

  describe('getProjectById', () => {
    it('should fetch project by id', async () => {
      const mockProject = { id: 1, name: 'Project A' };
      mockedAxios.get.mockResolvedValue({ data: mockProject });

      const result = await projectService.getProjectById(1);

      expect(result).toEqual(mockProject);
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const newProject = { name: 'New Project' };
      mockedAxios.post.mockResolvedValue({ data: newProject });

      const result = await projectService.createProject(newProject as any);

      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });
});
