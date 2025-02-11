# Meta Model Implementation Plan

## Design Principles

### 1. Core Data vs. Derived Data
- Store only fundamental, non-derivable data in models
- Calculate derived values on demand (e.g., employee capacity)
- Benefits:
  * Reduces data redundancy
  * Prevents inconsistencies
  * Makes calculations more flexible
  * Follows single source of truth principle

### 2. Dynamic Project Staffing
The system supports flexible staffing with:

1. Requirements Management:
   - Define project positions with required skills and time periods
   - Track coverage needs over time
   - Handle staff replacements and gaps
   - Priority levels for staffing needs

2. Assignment Lifecycle:
   - Create assignments for specific time periods
   - Track assignment status (active/completed/terminated)
   - Handle early terminations with reasons
   - Support multiple assignments per requirement
   - Allow staff changes during project

3. Coverage Tracking:
   - Monitor partially filled positions
   - Track periods needing coverage
   - Identify replacement needs
   - Historical assignment records

### 3. Employee Capacity Calculation
Instead of storing capacity as a field, it will be calculated based on:
- Employee status (active/inactive/on_leave)
- Contract terms
- Project assignments
- Other relevant factors

This approach allows for:
- Dynamic capacity updates
- Complex calculation rules
- Historical capacity tracking
- Better data consistency

## Schema Structure

### Employee Schema
Core attributes only:
```json
{
  "id": "integer",
  "name": "string",
  "entry_date": "date",
  "email": "string",
  "phone": "string?",
  "seniority_level": ["Junior", "Mid", "Senior", "Lead"],
  "qualifications": "string[]",
  "contract_end_date": "date?",
  "status": ["active", "inactive", "on_leave"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Project Schema
Basic project information:
```json
{
  "id": "integer",
  "name": "string",
  "project_number": "string",
  "start_date": "date",
  "end_date": "date",
  "location": "string",
  "project_manager_id": "integer",
  "documentation_links": "string[]",
  "status": ["active", "archived"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Project Requirement Schema
Defines and tracks staffing needs:
```json
{
  "id": "integer",
  "project_id": "integer",
  "role": "string",
  "seniority_level": ["Junior", "Mid", "Senior", "Lead"],
  "required_qualifications": "string[]",
  "start_date": "date",
  "end_date": "date",
  "status": ["open", "partially_filled", "filled", "needs_replacement"],
  "priority": ["low", "medium", "high", "critical"],
  "coverage_needed": {
    "periods": [
      {
        "start_date": "date",
        "end_date": "date"
      }
    ]
  },
  "notes": "string?",
  "current_assignment_id": "integer?",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Project Assignment Schema
Tracks actual staffing assignments:
```json
{
  "id": "integer",
  "project_id": "integer",
  "requirement_id": "integer",
  "employee_id": "integer",
  "role": "string",
  "dr_status": "string?",
  "position_status": "string?",
  "start_date": "date",
  "end_date": "date",
  "status": ["active", "completed", "terminated"],
  "termination_reason": "string?",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Implementation Steps

### Phase 1: Meta Schema Creation ✓
1. Create `meta/schemas` directory ✓
2. Define JSON Schema files for each entity ✓
   - Employee schema ✓
   - Project schema ✓
   - Project Requirement schema ✓
   - Project Assignment schema ✓
3. Include all validations and constraints ✓
4. Document relationships and dependencies ✓

### Phase 2: Generator Development
1. Create TypeScript generator
   - Output: Frontend type definitions
   - Include derived types (New/Update variants)
   
2. Create Validation generator
   - Output: Backend middleware
   - Include all validation rules
   
3. Create SQL generator
   - Output: Database schema
   - Include constraints and relationships

### Phase 3: Integration
1. Replace existing type definitions with generated ones
2. Update build process to include generation step
3. Add validation consistency tests
4. Update documentation

## Benefits
- Single source of truth for data models
- Consistent validation across all layers
- Automated code generation reduces errors
- Self-documenting API and database schema
- Easier to maintain and evolve the data model
- Clear separation of core data and derived values
- Flexible project staffing workflow
- Complete historical tracking

## Next Steps
1. Develop code generators
2. Create capacity calculation service
3. Implement requirement matching algorithm
4. Create coverage analysis service
5. Plan migration strategy

## Technical Considerations
1. Capacity calculation service design
2. Requirement matching algorithm design
3. Coverage gap analysis
4. Assignment history tracking
5. Performance optimization for calculations
6. Historical data tracking
7. API design for derived values
8. Workflow state management
9. Timeline visualization
10. Staffing analytics and reporting