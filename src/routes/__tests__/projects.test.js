const express = require('express');
const request = require('supertest');
const projectsRouter = require('../projects');

// Mock the service
jest.mock('../../services/projectService');
const projectService = require('../../services/projectService');

const app = express();
app.use(express.json());
app.use('/api/projects', projectsRouter);

describe('Projects Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        { id: 1, name: 'Project A', status: 'active' },
        { id: 2, name: 'Project B', status: 'completed' }
      ];
      projectService.getAllProjects = jest.fn().mockResolvedValue(mockProjects);

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body).toEqual(mockProjects);
      expect(projectService.getAllProjects).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      projectService.getAllProjects = jest.fn().mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/projects')
        .expect(500);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return project by id', async () => {
      const mockProject = { id: 1, name: 'Project A', status: 'active' };
      projectService.getProjectById = jest.fn().mockResolvedValue(mockProject);

      const response = await request(app)
        .get('/api/projects/1')
        .expect(200);

      expect(response.body).toEqual(mockProject);
      expect(projectService.getProjectById).toHaveBeenCalledWith(1);
    });

    it('should return 404 when project not found', async () => {
      projectService.getProjectById = jest.fn().mockResolvedValue(null);

      await request(app)
        .get('/api/projects/999')
        .expect(404);
    });

    it('should return 400 for invalid id', async () => {
      await request(app)
        .get('/api/projects/invalid')
        .expect(400);
    });
  });

  describe('POST /api/projects', () => {
    it('should create new project', async () => {
      const newProject = {
        name: 'New Project',
        status: 'planning',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      };
      const createdProject = { id: 3, ...newProject };
      projectService.createProject = jest.fn().mockResolvedValue(createdProject);

      const response = await request(app)
        .post('/api/projects')
        .send(newProject)
        .expect(201);

      expect(response.body).toEqual(createdProject);
      expect(projectService.createProject).toHaveBeenCalledWith(newProject);
    });

    it('should handle validation errors', async () => {
      projectService.createProject = jest.fn().mockRejectedValue(new Error('Validation error'));

      await request(app)
        .post('/api/projects')
        .send({ name: 'Test' })
        .expect(500);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project', async () => {
      const updateData = { name: 'Updated Project', status: 'active' };
      const updatedProject = { id: 1, ...updateData };
      projectService.updateProject = jest.fn().mockResolvedValue(updatedProject);

      const response = await request(app)
        .put('/api/projects/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedProject);
      expect(projectService.updateProject).toHaveBeenCalledWith(1, updateData);
    });

    it('should return 404 when project not found', async () => {
      projectService.updateProject = jest.fn().mockResolvedValue(null);

      await request(app)
        .put('/api/projects/999')
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should return 400 for invalid id', async () => {
      await request(app)
        .put('/api/projects/invalid')
        .send({ name: 'Test' })
        .expect(400);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project', async () => {
      projectService.deleteProject = jest.fn().mockResolvedValue(true);

      await request(app)
        .delete('/api/projects/1')
        .expect(204);

      expect(projectService.deleteProject).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid id', async () => {
      await request(app)
        .delete('/api/projects/invalid')
        .expect(400);
    });

    it('should handle service errors', async () => {
      projectService.deleteProject = jest.fn().mockRejectedValue(new Error('Delete failed'));

      await request(app)
        .delete('/api/projects/1')
        .expect(500);
    });
  });

  describe('GET /api/projects/:id/assignments', () => {
    it('should return project assignments', async () => {
      const mockAssignments = [
        { id: 1, employee_id: 1, project_id: 1 },
        { id: 2, employee_id: 2, project_id: 1 }
      ];
      projectService.getProjectAssignments = jest.fn().mockResolvedValue(mockAssignments);

      const response = await request(app)
        .get('/api/projects/1/assignments')
        .expect(200);

      expect(response.body).toEqual(mockAssignments);
      expect(projectService.getProjectAssignments).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid id', async () => {
      await request(app)
        .get('/api/projects/invalid/assignments')
        .expect(400);
    });
  });
});
