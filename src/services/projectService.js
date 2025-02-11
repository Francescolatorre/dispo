import { ProjectRepository } from '../repositories/project.repository.js';
import { EmployeeRepository } from '../repositories/employee.repository.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../errors/index.js';

export class ProjectService {
  constructor(
    projectRepository = new ProjectRepository(),
    employeeRepository = new EmployeeRepository()
  ) {
    this.projectRepository = projectRepository;
    this.employeeRepository = employeeRepository;
  }

  /**
   * Create a new project
   * @param {Object} projectData Project data
   * @returns {Promise<Object>} Created project
   */
  async createProject(projectData) {
    logger.info('Creating new project', {
      context: {
        projectNumber: projectData.project_number,
        managerId: projectData.project_manager_id,
        service: 'ProjectService',
        operation: 'createProject'
      }
    });

    try {
      // Verify project manager exists
      await this.employeeRepository.findById(projectData.project_manager_id);

      return await this.projectRepository.withTransaction(async () => {
        const project = await this.projectRepository.createProject(projectData);

        logger.info('Project created successfully', {
          context: {
            projectId: project.id,
            projectNumber: project.project_number,
            managerId: project.project_manager_id
          }
        });

        return project;
      });
    } catch (error) {
      logger.error('Failed to create project', {
        error,
        context: {
          projectNumber: projectData.project_number,
          managerId: projectData.project_manager_id,
          service: 'ProjectService',
          operation: 'createProject'
        }
      });
      throw error;
    }
  }

  /**
   * Get project by ID
   * @param {string} id Project ID
   * @returns {Promise<Object>} Project object
   */
  async getProjectById(id) {
    logger.info('Fetching project by ID', {
      context: {
        projectId: id,
        service: 'ProjectService',
        operation: 'getProjectById'
      }
    });

    try {
      const project = await this.projectRepository.findById(id);

      logger.debug('Project found', {
        context: {
          projectId: id,
          projectNumber: project.project_number
        }
      });

      return project;
    } catch (error) {
      logger.error('Failed to fetch project', {
        error,
        context: {
          projectId: id,
          service: 'ProjectService',
          operation: 'getProjectById'
        }
      });
      throw error;
    }
  }

  /**
   * List all projects with filters and pagination
   * @param {Object} options Query options
   * @returns {Promise<{projects: Array, totalCount: number, hasMore: boolean}>}
   */
  async listProjects(options = {}) {
    logger.info('Listing projects', {
      context: {
        options,
        service: 'ProjectService',
        operation: 'listProjects'
      }
    });

    try {
      const result = await this.projectRepository.listProjects(options);

      logger.debug('Projects listed successfully', {
        context: {
          count: result.projects.length,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          filters: options
        }
      });

      return result;
    } catch (error) {
      logger.error('Failed to list projects', {
        error,
        context: {
          options,
          service: 'ProjectService',
          operation: 'listProjects'
        }
      });
      throw error;
    }
  }

  /**
   * Update project
   * @param {string} id Project ID
   * @param {Object} updateData Update data
   * @returns {Promise<Object>} Updated project
   */
  async updateProject(id, updateData) {
    logger.info('Updating project', {
      context: {
        projectId: id,
        updateFields: Object.keys(updateData),
        service: 'ProjectService',
        operation: 'updateProject'
      }
    });

    try {
      return await this.projectRepository.withTransaction(async () => {
        // Verify project exists
        await this.projectRepository.findById(id);

        // If updating project manager, verify they exist
        if (updateData.project_manager_id) {
          await this.employeeRepository.findById(updateData.project_manager_id);
        }

        const project = await this.projectRepository.updateProject(id, updateData);

        logger.info('Project updated successfully', {
          context: {
            projectId: id,
            projectNumber: project.project_number,
            updatedFields: Object.keys(updateData)
          }
        });

        return project;
      });
    } catch (error) {
      logger.error('Failed to update project', {
        error,
        context: {
          projectId: id,
          updateData,
          service: 'ProjectService',
          operation: 'updateProject'
        }
      });
      throw error;
    }
  }

  /**
   * Delete project
   * @param {string} id Project ID
   * @returns {Promise<void>}
   */
  async deleteProject(id) {
    logger.info('Deleting project', {
      context: {
        projectId: id,
        service: 'ProjectService',
        operation: 'deleteProject'
      }
    });

    try {
      await this.projectRepository.withTransaction(async () => {
        await this.projectRepository.deleteProject(id);

        logger.info('Project deleted successfully', {
          context: {
            projectId: id
          }
        });
      });
    } catch (error) {
      logger.error('Failed to delete project', {
        error,
        context: {
          projectId: id,
          service: 'ProjectService',
          operation: 'deleteProject'
        }
      });
      throw error;
    }
  }

  /**
   * Get project assignments
   * @param {string} id Project ID
   * @returns {Promise<Array>} List of project assignments
   */
  async getProjectAssignments(id) {
    logger.info('Fetching project assignments', {
      context: {
        projectId: id,
        service: 'ProjectService',
        operation: 'getProjectAssignments'
      }
    });

    try {
      // Verify project exists
      await this.projectRepository.findById(id);

      const assignments = await this.projectRepository.getProjectAssignments(id);

      logger.debug('Project assignments fetched successfully', {
        context: {
          projectId: id,
          assignmentCount: assignments.length
        }
      });

      return assignments;
    } catch (error) {
      logger.error('Failed to fetch project assignments', {
        error,
        context: {
          projectId: id,
          service: 'ProjectService',
          operation: 'getProjectAssignments'
        }
      });
      throw error;
    }
  }

  /**
   * Validate project dates
   * @param {string} startDate Start date
   * @param {string} endDate End date
   * @returns {boolean} True if valid
   */
  validateProjectDates(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new ValidationError('End date must be after start date', 'end_date');
    }

    return true;
  }
}