# Demo Test Plan

## Setup Verification

### 1. Environment Check
- [ ] MSW service worker initialized
- [ ] Mock data loaded
- [ ] API endpoints responding
- [ ] React Query dev tools available

### 2. Route Navigation
- [ ] Project detail page loads
- [ ] Tabs navigation works
- [ ] Assignment panel displays
- [ ] Form modal functions

## Functional Testing

### 1. Project View
- [ ] Project details displayed correctly
- [ ] Assignment list shows mock data
- [ ] Workload indicators visible
- [ ] Tab navigation functional

### 2. Assignment Creation
```typescript
// Test scenario
const newAssignment = {
  project_id: 1,
  employee_id: 3,
  role: 'Developer',
  start_date: '2024-04-01',
  end_date: '2024-09-30',
  allocation_percentage: 50,
  dr_status: 'DR2',
  position_status: 'P2'
};
```
- [ ] Form opens correctly
- [ ] Fields populate with defaults
- [ ] Validation works
- [ ] Submission successful

### 3. Assignment Editing
```typescript
// Test scenario
const updateData = {
  allocation_percentage: 70,
  end_date: '2024-10-31'
};
```
- [ ] Edit form loads with data
- [ ] Updates reflect immediately
- [ ] Validation checks workload
- [ ] Changes persist

### 4. Assignment Deletion
- [ ] Confirmation dialog shows
- [ ] Deletion removes item
- [ ] List updates automatically
- [ ] Error handling works

### 5. Workload Validation
```typescript
// Test scenarios
const validScenario = {
  employeeId: 1,
  allocationPercentage: 40  // Should work with existing 60%
};

const warningScenario = {
  employeeId: 2,
  allocationPercentage: 50  // Should warn at 90% total
};

const errorScenario = {
  employeeId: 3,
  allocationPercentage: 60  // Should fail at 110% total
};
```
- [ ] Valid allocations accepted
- [ ] Warnings shown correctly
- [ ] Overallocation prevented
- [ ] Error messages clear

## Data Flow Testing

### 1. Context Updates
- [ ] Project context updates
- [ ] Assignment list refreshes
- [ ] Workload recalculates
- [ ] UI reflects changes

### 2. Form State
- [ ] Initial values set
- [ ] Validation triggers
- [ ] Error states show
- [ ] Success feedback

### 3. API Integration
- [ ] GET requests work
- [ ] POST requests work
- [ ] PATCH requests work
- [ ] DELETE requests work

## Visual Testing

### 1. Component Layout
- [ ] Form layout correct
- [ ] List view organized
- [ ] Spacing consistent
- [ ] Responsive design

### 2. Interactive Elements
- [ ] Buttons clickable
- [ ] Forms accessible
- [ ] Modals centered
- [ ] Tooltips visible

### 3. Status Indicators
- [ ] Loading states show
- [ ] Error states visible
- [ ] Success feedback clear
- [ ] Workload colors correct

## Error Handling

### 1. Form Validation
- [ ] Required fields checked
- [ ] Date ranges validated
- [ ] Allocation limits enforced
- [ ] Error messages clear

### 2. API Errors
- [ ] Network errors handled
- [ ] 404 responses managed
- [ ] Validation errors shown
- [ ] Recovery possible

### 3. Edge Cases
- [ ] Empty states handled
- [ ] Large numbers managed
- [ ] Special characters
- [ ] Concurrent updates

## Demo Scenarios

### 1. Basic Workflow
1. View project details
2. Create new assignment
3. Edit allocation
4. Delete assignment

### 2. Workload Management
1. View current workload
2. Add assignment
3. See warning threshold
4. Hit error threshold

### 3. Data Validation
1. Try invalid dates
2. Test allocation limits
3. Check required fields
4. Test error messages

## Success Criteria

### Must Pass
- [ ] Assignment CRUD operations
- [ ] Workload validation
- [ ] Data persistence
- [ ] Error handling

### Should Pass
- [ ] UI responsiveness
- [ ] Clear feedback
- [ ] Smooth transitions
- [ ] Data consistency

### Nice to Have
- [ ] Performance optimization
- [ ] Advanced filtering
- [ ] Bulk operations
- [ ] Export functionality

## Test Environment

### Development Setup
```bash
# Start development server
cd client
npm run dev

# Check MSW status
# Browser console should show:
# [MSW] Mocking enabled
```

### Mock Data Verification
```typescript
// Browser console commands
await fetch('/api/projects/1').then(r => r.json())
await fetch('/api/assignments').then(r => r.json())
```

### Browser Support
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest

## Next Steps

### 1. Immediate
- Run through basic workflow
- Verify CRUD operations
- Check workload validation
- Test error handling

### 2. Short Term
- Add more test scenarios
- Improve error handling
- Enhance feedback
- Document findings

### 3. Future
- Performance testing
- Accessibility audit
- User feedback
- Feature expansion