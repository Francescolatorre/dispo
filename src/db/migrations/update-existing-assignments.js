const { pool } = require('../config/database');
const WorkloadService = require('../../services/workloadService');

/**
 * Update existing assignments with workload warnings
 */
async function updateExistingAssignments() {
  const client = await pool.connect();
  try {
    console.log('Starting update of existing assignments...');
    
    // Get all active assignments
    const { rows: assignments } = await client.query(
      `SELECT 
        id,
        employee_id,
        start_date,
        end_date,
        allocation_percentage
       FROM project_assignments
       WHERE status = 'active'
       ORDER BY employee_id, start_date`
    );

    console.log(`Found ${assignments.length} active assignments to process`);

    // Process each assignment
    for (const assignment of assignments) {
      try {
        // Validate workload
        const validation = await WorkloadService.validateAssignment(
          assignment.employee_id,
          assignment.start_date,
          assignment.end_date,
          assignment.allocation_percentage
        );

        // Update assignment with warning flag
        await client.query(
          `UPDATE project_assignments
           SET workload_warning = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [validation.warning, assignment.id]
        );

        console.log(`Updated assignment ${assignment.id}: warning=${validation.warning}`);
      } catch (error) {
        console.error(`Error processing assignment ${assignment.id}:`, error.message);
      }
    }

    console.log('Finished updating assignments');
  } catch (error) {
    console.error('Error updating assignments:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  updateExistingAssignments()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to update assignments:', error);
      process.exit(1);
    });
}

module.exports = updateExistingAssignments;