/**
 * Test utilities for verifying API endpoints and data flow
 * Run these functions in the browser console
 */

export const testEndpoints = {
  // Store created assignment ID for cleanup
  createdAssignmentId: null as number | null,

  // Project endpoints
  async testProjects() {
    console.group('Testing Project Endpoints');
    try {
      const projects = await fetch('/api/projects').then(r => r.json());
      console.log('GET /api/projects:', projects);

      const project = await fetch('/api/projects/1').then(r => r.json());
      console.log('GET /api/projects/1:', project);
    } catch (error) {
      console.error('Project endpoint error:', error);
    }
    console.groupEnd();
  },

  // Assignment endpoints
  async testAssignments() {
    console.group('Testing Assignment Endpoints');
    try {
      // Get all assignments
      const assignments = await fetch('/api/assignments').then(r => r.json());
      console.log('GET /api/assignments:', assignments);

      // Get project assignments
      const projectAssignments = await fetch('/api/projects/1/assignments').then(r => r.json());
      console.log('GET /api/projects/1/assignments:', projectAssignments);

      // Test assignment creation with valid workload
      const newAssignment = {
        project_id: 1,
        employee_id: 3,
        role: 'Developer',
        start_date: '2024-04-01',
        end_date: '2024-09-30',
        allocation_percentage: 30, // Reduced to pass validation
        dr_status: 'DR2',
        position_status: 'P2'
      };

      const createResponse = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssignment)
      });

      const created = await createResponse.json();
      if (createResponse.ok) {
        console.log('POST /api/assignments - Success:', created);
        this.createdAssignmentId = created.id;

        // Test assignment update
        const update = {
          allocation_percentage: 40 // Small increase should still be valid
        };

        const updateResponse = await fetch(`/api/assignments/${this.createdAssignmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });

        if (updateResponse.ok) {
          const updated = await updateResponse.json();
          console.log('PATCH /api/assignments/:id - Success:', updated);

          // Test assignment deletion
          const deleteResponse = await fetch(`/api/assignments/${this.createdAssignmentId}`, {
            method: 'DELETE'
          });

          if (deleteResponse.ok) {
            console.log('DELETE /api/assignments/:id - Success');
            this.createdAssignmentId = null;
          } else {
            console.error('DELETE /api/assignments/:id - Failed:', await deleteResponse.text());
          }
        } else {
          console.error('PATCH /api/assignments/:id - Failed:', await updateResponse.json());
        }
      } else {
        console.error('POST /api/assignments - Failed:', created);
      }
    } catch (error) {
      console.error('Assignment endpoint error:', error);
    }
    console.groupEnd();
  },

  // Workload validation
  async testWorkloadValidation() {
    console.group('Testing Workload Validation');
    try {
      // Test valid allocation
      const validTest = await fetch('/api/assignments/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 3,
          startDate: '2024-04-01',
          endDate: '2024-09-30',
          allocationPercentage: 30
        })
      }).then(r => r.json());
      console.log('Valid workload test (30%):', validTest);

      // Test warning threshold
      const warningTest = await fetch('/api/assignments/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 3,
          startDate: '2024-04-01',
          endDate: '2024-09-30',
          allocationPercentage: 85
        })
      }).then(r => r.json());
      console.log('Warning threshold test (85%):', warningTest);

      // Test error threshold
      const errorTest = await fetch('/api/assignments/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 3,
          startDate: '2024-04-01',
          endDate: '2024-09-30',
          allocationPercentage: 110
        })
      }).then(r => r.json());
      console.log('Error threshold test (110%):', errorTest);
    } catch (error) {
      console.error('Validation endpoint error:', error);
    }
    console.groupEnd();
  },

  // Run all tests
  async testAll() {
    console.group('Running All API Tests');
    await this.testProjects();
    await this.testAssignments();
    await this.testWorkloadValidation();
    console.groupEnd();
  },

  // Cleanup any test data
  async cleanup() {
    if (this.createdAssignmentId) {
      try {
        await fetch(`/api/assignments/${this.createdAssignmentId}`, {
          method: 'DELETE'
        });
        console.log('Cleanup: Deleted test assignment');
        this.createdAssignmentId = null;
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  }
};

// Make test utilities available in browser console
(window as any).testApi = testEndpoints;