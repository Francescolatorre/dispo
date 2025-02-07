import { http, HttpResponse } from 'msw';
import {
  mockProjects,
  mockEmployees,
  mockAssignments,
  getProjectAssignments,
  getEmployeeAssignments,
  calculateWorkloadForRange,
} from './data';
import type { CreateAssignmentDto, UpdateAssignmentDto, AssignmentWithRelations } from '../types/assignment';

let nextAssignmentId = Math.max(...mockAssignments.map(a => a.id)) + 1;

export const handlers = [
  // Projects
  http.get('/api/projects', () => {
    return HttpResponse.json(mockProjects);
  }),

  http.get('/api/projects/:id', ({ params }) => {
    const project = mockProjects.find(p => p.id === Number(params.id));
    if (!project) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(project);
  }),

  // Employees
  http.get('/api/employees', () => {
    return HttpResponse.json(mockEmployees);
  }),

  http.get('/api/employees/:id', ({ params }) => {
    const employee = mockEmployees.find(e => e.id === Number(params.id));
    if (!employee) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(employee);
  }),

  // Assignments
  http.get('/api/assignments', () => {
    return HttpResponse.json(mockAssignments);
  }),

  http.get('/api/projects/:id/assignments', ({ params }) => {
    const assignments = getProjectAssignments(Number(params.id));
    return HttpResponse.json(assignments);
  }),

  http.get('/api/employees/:id/assignments', ({ params }) => {
    const assignments = getEmployeeAssignments(Number(params.id));
    return HttpResponse.json(assignments);
  }),

  http.post('/api/assignments', async ({ request }) => {
    const data = await request.json() as CreateAssignmentDto;
    
    // Get employee and project
    const employee = mockEmployees.find(e => e.id === data.employee_id);
    const project = mockProjects.find(p => p.id === data.project_id);
    
    if (!employee || !project) {
      return HttpResponse.json(
        { message: 'Employee or project not found' },
        { status: 404 }
      );
    }

    // Calculate workload for the assignment period
    const workload = calculateWorkloadForRange(
      data.employee_id,
      data.start_date,
      data.end_date
    );

    const totalWorkload = workload + data.allocation_percentage;

    if (totalWorkload > 100) {
      return HttpResponse.json(
        {
          message: `Total workload would exceed 100%: ${totalWorkload}%`
        },
        { status: 400 }
      );
    }

    const newAssignment: AssignmentWithRelations = {
      id: nextAssignmentId++,
      ...data,
      status: 'active',
      project_name: project.name,
      employee_name: employee.name,
    };

    mockAssignments.push(newAssignment);
    return HttpResponse.json(newAssignment, { status: 201 });
  }),

  http.patch('/api/assignments/:id', async ({ params, request }) => {
    const data = await request.json() as UpdateAssignmentDto;
    const index = mockAssignments.findIndex(a => a.id === Number(params.id));

    if (index === -1) {
      return HttpResponse.json(
        { message: 'Assignment not found' },
        { status: 404 }
      );
    }

    const currentAssignment = mockAssignments[index];
    const employee = mockEmployees.find(e => e.id === currentAssignment.employee_id);

    if (!employee) {
      return HttpResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    // If allocation or dates are being updated, validate workload
    if (data.allocation_percentage || data.start_date || data.end_date) {
      const workload = calculateWorkloadForRange(
        currentAssignment.employee_id,
        data.start_date || currentAssignment.start_date,
        data.end_date || currentAssignment.end_date,
        currentAssignment.id
      );

      const newAllocation = data.allocation_percentage || currentAssignment.allocation_percentage;
      const totalWorkload = workload + newAllocation;

      if (totalWorkload > 100) {
        return HttpResponse.json(
          {
            message: `Total workload would exceed 100%: ${totalWorkload}%`
          },
          { status: 400 }
        );
      }
    }

    mockAssignments[index] = {
      ...currentAssignment,
      ...data,
    };

    return HttpResponse.json(mockAssignments[index]);
  }),

  http.delete('/api/assignments/:id', ({ params }) => {
    const index = mockAssignments.findIndex(a => a.id === Number(params.id));

    if (index === -1) {
      return HttpResponse.json(
        { message: 'Assignment not found' },
        { status: 404 }
      );
    }

    mockAssignments.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Workload validation
  http.post('/api/assignments/validate', async ({ request }) => {
    const data = await request.json() as {
      employeeId: number;
      startDate: string;
      endDate: string;
      allocationPercentage: number;
      currentAssignmentId?: number;
    };

    const employee = mockEmployees.find(e => e.id === data.employeeId);
    if (!employee) {
      return HttpResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    const workload = calculateWorkloadForRange(
      data.employeeId,
      data.startDate,
      data.endDate,
      data.currentAssignmentId
    );

    const totalWorkload = workload + data.allocationPercentage;

    if (totalWorkload > 100) {
      return HttpResponse.json({
        valid: false,
        warning: false,
        message: `Total workload would exceed 100%: ${totalWorkload}%`
      });
    }

    if (totalWorkload > 80) {
      return HttpResponse.json({
        valid: true,
        warning: true,
        message: 'High workload warning (>80%)'
      });
    }

    return HttpResponse.json({
      valid: true,
      warning: false
    });
  }),
];