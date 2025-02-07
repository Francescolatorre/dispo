# Ressourcenplanung Technical Specification (Revised)

## 1. Data Models

### Database Schema Updates

```sql
-- Add columns to project_assignments
ALTER TABLE project_assignments
ADD COLUMN IF NOT EXISTS workload_warning BOOLEAN DEFAULT false;

-- Add columns to employees
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS default_hours_per_day INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS flexible_hours BOOLEAN DEFAULT false;
```

## 2. Service Layer Implementation

### WorkloadService

```typescript
interface DailyWorkload {
  date: Date;
  totalWorkload: number;
  assignments: {
    projectId: number;
    projectName: string;
    allocation: number;
  }[];
}

class WorkloadService {
  /**
   * Calculate employee workload for a period
   */
  async calculateWorkload(
    employeeId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<DailyWorkload[]> {
    // Get employee details
    const employee = await employeeService.getEmployeeById(employeeId);
    const workTimeFactor = employee.work_time_factor;
    const partTimeFactor = employee.part_time_factor / 100;

    // Get all assignments in period
    const assignments = await assignmentService.getEmployeeAssignments(employeeId);
    
    // Get all dates in range
    const dates = this.generateDateRange(startDate, endDate);
    
    // Calculate workload for each date
    return dates.map(date => {
      const dailyAssignments = assignments.filter(assignment => 
        this.isDateInRange(date, assignment.start_date, assignment.end_date)
      );

      const totalWorkload = dailyAssignments.reduce((sum, assignment) => 
        sum + (assignment.allocation_percentage * workTimeFactor * partTimeFactor),
        0
      );

      return {
        date,
        totalWorkload,
        assignments: dailyAssignments.map(a => ({
          projectId: a.project_id,
          projectName: a.project_name,
          allocation: a.allocation_percentage * workTimeFactor * partTimeFactor
        }))
      };
    });
  }

  /**
   * Validate assignment workload
   */
  async validateAssignment(
    employeeId: number,
    startDate: Date,
    endDate: Date,
    allocation: number
  ): Promise<{
    valid: boolean;
    warning: boolean;
    message?: string;
  }> {
    // Check allocation steps
    if (allocation % 10 !== 0) {
      return {
        valid: false,
        warning: false,
        message: 'Allocation must be in steps of 10%'
      };
    }

    // Calculate existing workload
    const workload = await this.calculateWorkload(employeeId, startDate, endDate);
    const maxWorkload = Math.max(...workload.map(w => w.totalWorkload));

    // Check total allocation
    if (maxWorkload + allocation > 100) {
      return {
        valid: false,
        warning: false,
        message: `Total workload would exceed 100%: ${maxWorkload + allocation}%`
      };
    }

    // Check for warnings (>80% allocation)
    const warning = maxWorkload + allocation > 80;

    return {
      valid: true,
      warning,
      message: warning ? 'High workload warning (>80%)' : undefined
    };
  }

  /**
   * Check for absence conflicts
   */
  async checkAbsenceConflicts(
    employeeId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    hasConflicts: boolean;
    conflicts?: Array<{
      type: string;
      startDate: Date;
      endDate: Date;
    }>;
  }> {
    const absences = await absenceService.getEmployeeAbsences(
      employeeId,
      startDate,
      endDate
    );

    return {
      hasConflicts: absences.length > 0,
      conflicts: absences.map(absence => ({
        type: absence.type,
        startDate: absence.start_date,
        endDate: absence.end_date
      }))
    };
  }

  private generateDateRange(start: Date, end: Date): Date[] {
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  private isDateInRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  }
}
```

### Enhanced AssignmentService

```typescript
class AssignmentService {
  constructor(
    private workloadService: WorkloadService,
    private employeeService: EmployeeService
  ) {}

  /**
   * Create assignment with validation
   */
  async createAssignment(data: CreateAssignmentDto): Promise<Assignment> {
    // Validate workload
    const workloadValidation = await this.workloadService.validateAssignment(
      data.employee_id,
      data.start_date,
      data.end_date,
      data.allocation_percentage
    );

    if (!workloadValidation.valid) {
      throw new Error(workloadValidation.message);
    }

    // Check absence conflicts
    const absenceCheck = await this.workloadService.checkAbsenceConflicts(
      data.employee_id,
      data.start_date,
      data.end_date
    );

    if (absenceCheck.hasConflicts) {
      throw new Error('Assignment overlaps with absences');
    }

    // Create assignment
    const assignment = await this.create({
      ...data,
      workload_warning: workloadValidation.warning
    });

    return assignment;
  }

  /**
   * Get workload overview
   */
  async getWorkloadOverview(
    projectId: number,
    startDate: Date,
    endDate: Date
  ): Promise<WorkloadOverview> {
    const assignments = await this.getProjectAssignments(projectId);
    const employees = new Set(assignments.map(a => a.employee_id));

    const workloads = await Promise.all(
      Array.from(employees).map(async employeeId => {
        const workload = await this.workloadService.calculateWorkload(
          employeeId,
          startDate,
          endDate
        );

        return {
          employeeId,
          employeeName: assignments.find(a => a.employee_id === employeeId)?.employee_name,
          workload
        };
      })
    );

    return {
      projectId,
      period: { startDate, endDate },
      workloads
    };
  }
}
```

## 3. API Layer

### New Routes

```typescript
// assignments.routes.ts
router.post('/validate', async (req, res) => {
  const validation = await workloadService.validateAssignment(
    req.body.employee_id,
    req.body.start_date,
    req.body.end_date,
    req.body.allocation_percentage
  );
  res.json(validation);
});

router.get('/workload/:employeeId', async (req, res) => {
  const workload = await workloadService.calculateWorkload(
    req.params.employeeId,
    req.query.start_date,
    req.query.end_date
  );
  res.json(workload);
});

router.get('/project/:projectId/workload', async (req, res) => {
  const overview = await assignmentService.getWorkloadOverview(
    req.params.projectId,
    req.query.start_date,
    req.query.end_date
  );
  res.json(overview);
});
```

## 4. Frontend Components

### ResourceTimeline Component

```typescript
interface ResourceTimelineProps {
  projectId: number;
  startDate: Date;
  endDate: Date;
  onAssignmentCreate?: (assignment: Assignment) => void;
  onAssignmentUpdate?: (assignment: Assignment) => void;
}

const ResourceTimeline: React.FC<ResourceTimelineProps> = ({
  projectId,
  startDate,
  endDate,
  onAssignmentCreate,
  onAssignmentUpdate
}) => {
  const [workloadData, setWorkloadData] = useState<WorkloadOverview | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadWorkloadData();
  }, [projectId, startDate, endDate]);

  const loadWorkloadData = async () => {
    const data = await assignmentService.getWorkloadOverview(
      projectId,
      startDate,
      endDate
    );
    setWorkloadData(data);
  };

  const handleAssignmentDrop = async (employeeId: number, date: Date) => {
    setSelectedDate(date);
    // Open assignment dialog
  };

  return (
    <div>
      <TimelineHeader dates={generateDateRange(startDate, endDate)} />
      {workloadData?.workloads.map(employeeWorkload => (
        <TimelineRow
          key={employeeWorkload.employeeId}
          employeeId={employeeWorkload.employeeId}
          employeeName={employeeWorkload.employeeName}
          workload={employeeWorkload.workload}
          onDrop={handleAssignmentDrop}
        />
      ))}
      {selectedDate && (
        <AssignmentDialog
          date={selectedDate}
          onSave={handleAssignmentSave}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};
```

## 5. Implementation Plan

### Phase 1: Core Services
1. Implement WorkloadService
2. Enhance AssignmentService
3. Add validation logic
4. Write unit tests

### Phase 2: API Layer
1. Add new endpoints
2. Implement validation middleware
3. Add error handling
4. Write integration tests

### Phase 3: Frontend
1. Build timeline component
2. Add workload visualization
3. Implement drag-drop
4. Add warning system

## 6. Testing Strategy

### Unit Tests
```typescript
describe('WorkloadService', () => {
  describe('calculateWorkload', () => {
    it('should calculate correct workload for single assignment', async () => {
      // Test implementation
    });

    it('should handle overlapping assignments', async () => {
      // Test implementation
    });

    it('should consider part-time factors', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests
```typescript
describe('Assignment API', () => {
  describe('POST /assignments', () => {
    it('should validate workload before creating', async () => {
      // Test implementation
    });

    it('should check absence conflicts', async () => {
      // Test implementation
    });
  });
});
```

### E2E Tests
```typescript
describe('Resource Timeline', () => {
  it('should display correct workload', async () => {
    // Test implementation
  });

  it('should allow assignment creation', async () => {
    // Test implementation
  });
});