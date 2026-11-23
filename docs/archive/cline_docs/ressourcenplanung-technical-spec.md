# Ressourcenplanung Technical Specification

## 1. Database Extensions

### New Functions

```sql
-- Calculate total workload for an employee in a given period
CREATE OR REPLACE FUNCTION calculate_employee_workload(
    p_employee_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    date DATE,
    total_workload DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE dates AS (
        SELECT p_start_date::date AS date
        UNION ALL
        SELECT date + 1
        FROM dates
        WHERE date < p_end_date
    ),
    daily_assignments AS (
        SELECT 
            d.date,
            COALESCE(SUM(
                a.allocation_percentage * 
                e.work_time_factor * 
                (e.part_time_factor / 100.0)
            ), 0) as workload
        FROM dates d
        LEFT JOIN project_assignments a ON 
            d.date BETWEEN a.start_date AND a.end_date
            AND a.employee_id = p_employee_id
            AND a.status = 'active'
        LEFT JOIN employees e ON a.employee_id = e.id
        GROUP BY d.date
    )
    SELECT 
        date,
        ROUND(workload::DECIMAL, 2) as total_workload
    FROM daily_assignments
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Validate assignment workload
CREATE OR REPLACE FUNCTION validate_assignment_workload()
RETURNS TRIGGER AS $$
DECLARE
    total_workload DECIMAL(5,2);
    employee_factor DECIMAL(5,2);
BEGIN
    -- Get employee work factors
    SELECT (work_time_factor * part_time_factor / 100.0)
    INTO employee_factor
    FROM employees
    WHERE id = NEW.employee_id;

    -- Check if allocation is in 10% steps
    IF MOD(NEW.allocation_percentage, 10) != 0 THEN
        RAISE EXCEPTION 'Allocation percentage must be in steps of 10%';
    END IF;

    -- Calculate total workload for the period
    WITH period_workload AS (
        SELECT MAX(total_workload) as max_workload
        FROM calculate_employee_workload(
            NEW.employee_id,
            NEW.start_date,
            NEW.end_date
        )
    )
    SELECT max_workload + (NEW.allocation_percentage * employee_factor)
    INTO total_workload
    FROM period_workload;

    -- Check for overallocation
    IF total_workload > 100 THEN
        RAISE EXCEPTION 'Total workload would exceed 100%: %', total_workload;
    END IF;

    -- Set warning flag for >80% allocation
    IF total_workload > 80 THEN
        NEW.has_workload_warning = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check for absence conflicts
CREATE OR REPLACE FUNCTION check_absence_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    conflict_exists BOOLEAN;
BEGIN
    -- Check for full allocation conflicts
    SELECT EXISTS (
        SELECT 1
        FROM project_assignments a
        WHERE a.employee_id = NEW.employee_id
        AND a.status = 'active'
        AND (NEW.start_date, NEW.end_date) OVERLAPS (a.start_date, a.end_date)
        AND a.allocation_percentage = 100
    ) INTO conflict_exists;

    IF conflict_exists THEN
        RAISE EXCEPTION 'Assignment conflicts with existing 100% allocation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Table Modifications

```sql
-- Add columns to project_assignments
ALTER TABLE project_assignments
ADD COLUMN IF NOT EXISTS has_workload_warning BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_workload_check TIMESTAMP WITH TIME ZONE;

-- Add columns to employees
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS default_hours_per_day INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS flexible_hours BOOLEAN DEFAULT false;
```

## 2. Service Layer Extensions

### AssignmentService Extensions

```javascript
class AssignmentService {
  // Existing methods...

  /**
   * Calculate employee workload for a period
   */
  async calculateWorkload(employeeId, startDate, endDate) {
    const result = await pool.query(
      `SELECT * FROM calculate_employee_workload($1, $2::date, $3::date)`,
      [employeeId, startDate, endDate]
    );
    return result.rows;
  }

  /**
   * Get workload warnings
   */
  async getWorkloadWarnings(projectId) {
    const result = await pool.query(
      `SELECT 
         e.name as employee_name,
         a.start_date,
         a.end_date,
         w.total_workload
       FROM project_assignments a
       JOIN employees e ON a.employee_id = e.id
       CROSS JOIN LATERAL (
         SELECT MAX(total_workload) as total_workload
         FROM calculate_employee_workload(
           a.employee_id,
           a.start_date,
           a.end_date
         )
       ) w
       WHERE a.project_id = $1
         AND (w.total_workload > 80 OR a.has_workload_warning)
       ORDER BY w.total_workload DESC`,
      [projectId]
    );
    return result.rows;
  }

  /**
   * Validate assignment before creation
   */
  async validateAssignment(data) {
    const {
      employee_id,
      start_date,
      end_date,
      allocation_percentage
    } = data;

    // Check allocation steps
    if (allocation_percentage % 10 !== 0) {
      throw new Error('Allocation must be in steps of 10%');
    }

    // Check existing workload
    const workload = await this.calculateWorkload(
      employee_id,
      start_date,
      end_date
    );

    const maxWorkload = Math.max(...workload.map(w => w.total_workload));
    if (maxWorkload + allocation_percentage > 100) {
      throw new Error(`Total workload would exceed 100%: ${maxWorkload + allocation_percentage}%`);
    }

    // Check absence conflicts
    const absences = await pool.query(
      `SELECT * FROM absences
       WHERE employee_id = $1
         AND (start_date, end_date) OVERLAPS ($2::date, $3::date)`,
      [employee_id, start_date, end_date]
    );

    if (absences.rows.length > 0) {
      throw new Error('Assignment overlaps with existing absences');
    }

    return true;
  }
}
```

## 3. API Endpoints

### New Endpoints

```javascript
// GET /api/assignments/{employeeId}/workload
router.get('/:employeeId/workload', async (req, res) => {
  const { employeeId } = req.params;
  const { start_date, end_date } = req.query;
  
  const workload = await assignmentService.calculateWorkload(
    employeeId,
    start_date,
    end_date
  );
  
  res.json(workload);
});

// GET /api/projects/{projectId}/workload-warnings
router.get('/:projectId/workload-warnings', async (req, res) => {
  const { projectId } = req.params;
  
  const warnings = await assignmentService.getWorkloadWarnings(projectId);
  
  res.json(warnings);
});
```

## 4. Frontend Components

### WorkloadChart Component

```typescript
interface WorkloadChartProps {
  employeeId: number;
  startDate: Date;
  endDate: Date;
}

const WorkloadChart: React.FC<WorkloadChartProps> = ({
  employeeId,
  startDate,
  endDate
}) => {
  // Implementation details...
};
```

### ResourceTimeline Component

```typescript
interface ResourceTimelineProps {
  projectId: number;
  showWarnings?: boolean;
}

const ResourceTimeline: React.FC<ResourceTimelineProps> = ({
  projectId,
  showWarnings = true
}) => {
  // Implementation details...
};
```

## 5. Implementation Phases

### Phase 1: Core Validation
1. Implement database functions
2. Add service layer validation
3. Update API endpoints
4. Add basic UI feedback

### Phase 2: Workload Visualization
1. Implement workload calculation
2. Create timeline component
3. Add warning system
4. Integrate absence checks

### Phase 3: Advanced Features
1. Add "What-if" planning
2. Implement bulk operations
3. Add export functionality

## 6. Testing Strategy

### Unit Tests
- Workload calculation
- Validation rules
- Date handling

### Integration Tests
- Assignment creation flow
- Warning system
- Absence integration

### End-to-End Tests
- Complete assignment workflow
- Timeline interaction
- Export functionality