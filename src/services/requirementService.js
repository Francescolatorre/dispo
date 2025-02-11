import { RequirementRepository } from '../repositories/requirement.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../errors/index.js';

export class RequirementService {
  constructor(
    requirementRepository = new RequirementRepository(),
    projectRepository = new ProjectRepository()
  ) {
    this.requirementRepository = requirementRepository;
    this.projectRepository = projectRepository;
  }

  /**
   * Create a new project requirement
   * @param {Object} requirementData Requirement data
   * @returns {Promise<Object>} Created requirement
   */
  async createRequirement(requirementData) {
    logger.info('Creating new requirement', {
      context: {
        projectId: requirementData.project_id,
        role: requirementData.role,
        service: 'RequirementService',
        operation: 'createRequirement'
      }
    });

    try {
      // Verify project exists
      await this.projectRepository.findById(requirementData.project_id);

      return await this.requirementRepository.withTransaction(async () => {
        const requirement = await this.requirementRepository.createRequirement(requirementData);

        logger.info('Requirement created successfully', {
          context: {
            requirementId: requirement.id,
            projectId: requirement.project_id,
            role: requirement.role
          }
        });

        return requirement;
      });
    } catch (error) {
      logger.error('Failed to create requirement', {
        error,
        context: {
          projectId: requirementData.project_id,
          role: requirementData.role,
          service: 'RequirementService',
          operation: 'createRequirement'
        }
      });
      throw error;
    }
  }

  /**
   * Get requirement by ID
   * @param {string} id Requirement ID
   * @returns {Promise<Object>} Requirement object
   */
  async getRequirementById(id) {
    logger.info('Fetching requirement by ID', {
      context: {
        requirementId: id,
        service: 'RequirementService',
        operation: 'getRequirementById'
      }
    });

    try {
      const requirement = await this.requirementRepository.findById(id);

      logger.debug('Requirement found', {
        context: {
          requirementId: id,
          projectId: requirement.project_id
        }
      });

      return requirement;
    } catch (error) {
      logger.error('Failed to fetch requirement', {
        error,
        context: {
          requirementId: id,
          service: 'RequirementService',
          operation: 'getRequirementById'
        }
      });
      throw error;
    }
  }

  /**
   * List requirements with filters
   * @param {Object} options Query options
   * @returns {Promise<{requirements: Array, totalCount: number, hasMore: boolean}>}
   */
  async listRequirements(options = {}) {
    logger.info('Listing requirements', {
      context: {
        options,
        service: 'RequirementService',
        operation: 'listRequirements'
      }
    });

    try {
      const result = await this.requirementRepository.listRequirements(options);

      logger.debug('Requirements listed successfully', {
        context: {
          count: result.requirements.length,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          filters: options
        }
      });

      return result;
    } catch (error) {
      logger.error('Failed to list requirements', {
        error,
        context: {
          options,
          service: 'RequirementService',
          operation: 'listRequirements'
        }
      });
      throw error;
    }
  }

  /**
   * Update requirement
   * @param {string} id Requirement ID
   * @param {Object} updateData Update data
   * @returns {Promise<Object>} Updated requirement
   */
  async updateRequirement(id, updateData) {
    logger.info('Updating requirement', {
      context: {
        requirementId: id,
        updateFields: Object.keys(updateData),
        service: 'RequirementService',
        operation: 'updateRequirement'
      }
    });

    try {
      return await this.requirementRepository.withTransaction(async () => {
        // Verify requirement exists
        await this.requirementRepository.findById(id);

        const requirement = await this.requirementRepository.updateRequirement(id, updateData);

        logger.info('Requirement updated successfully', {
          context: {
            requirementId: id,
            projectId: requirement.project_id,
            updatedFields: Object.keys(updateData)
          }
        });

        return requirement;
      });
    } catch (error) {
      logger.error('Failed to update requirement', {
        error,
        context: {
          requirementId: id,
          updateData,
          service: 'RequirementService',
          operation: 'updateRequirement'
        }
      });
      throw error;
    }
  }

  /**
   * Delete requirement
   * @param {string} id Requirement ID
   * @returns {Promise<void>}
   */
  async deleteRequirement(id) {
    logger.info('Deleting requirement', {
      context: {
        requirementId: id,
        service: 'RequirementService',
        operation: 'deleteRequirement'
      }
    });

    try {
      await this.requirementRepository.withTransaction(async () => {
        await this.requirementRepository.deleteRequirement(id);

        logger.info('Requirement deleted successfully', {
          context: {
            requirementId: id
          }
        });
      });
    } catch (error) {
      logger.error('Failed to delete requirement', {
        error,
        context: {
          requirementId: id,
          service: 'RequirementService',
          operation: 'deleteRequirement'
        }
      });
      throw error;
    }
  }

  /**
   * Get project requirements
   * @param {number} projectId Project ID
   * @returns {Promise<Array>} List of requirements
   */
  async getProjectRequirements(projectId) {
    logger.info('Fetching project requirements', {
      context: {
        projectId,
        service: 'RequirementService',
        operation: 'getProjectRequirements'
      }
    });

    try {
      // Verify project exists
      await this.projectRepository.findById(projectId);

      const requirements = await this.requirementRepository.getProjectRequirements(projectId);

      logger.debug('Project requirements fetched successfully', {
        context: {
          projectId,
          requirementCount: requirements.length
        }
      });

      return requirements;
    } catch (error) {
      logger.error('Failed to fetch project requirements', {
        error,
        context: {
          projectId,
          service: 'RequirementService',
          operation: 'getProjectRequirements'
        }
      });
      throw error;
    }
  }

  /**
   * Update requirement status
   * @param {string} id Requirement ID
   * @param {string} status New status
   * @param {number} assignmentId Optional assignment ID
   * @returns {Promise<Object>} Updated requirement
   */
  async updateRequirementStatus(id, status, assignmentId = null) {
    logger.info('Updating requirement status', {
      context: {
        requirementId: id,
        status,
        assignmentId,
        service: 'RequirementService',
        operation: 'updateRequirementStatus'
      }
    });

    try {
      return await this.requirementRepository.withTransaction(async () => {
        const requirement = await this.requirementRepository.updateRequirementStatus(
          id,
          status,
          assignmentId
        );

        logger.info('Requirement status updated successfully', {
          context: {
            requirementId: id,
            status,
            assignmentId
          }
        });

        return requirement;
      });
    } catch (error) {
      logger.error('Failed to update requirement status', {
        error,
        context: {
          requirementId: id,
          status,
          assignmentId,
          service: 'RequirementService',
          operation: 'updateRequirementStatus'
        }
      });
      throw error;
    }
  }
}