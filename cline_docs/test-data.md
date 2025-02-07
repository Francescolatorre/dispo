# Test Data Plan

## Sample Projects

### Website Relaunch (Komplexes Projekt)
```json
{
  "id": "proj-001",
  "name": "Website Relaunch 2024",
  "startDate": "2024-03-01",
  "endDate": "2024-08-31",
  "projectLeaderId": "emp-001",
  "status": "active"
}
```

### Mobile App Update (Mittleres Projekt)
```json
{
  "id": "proj-002",
  "name": "Mobile App Version 2.0",
  "startDate": "2024-04-01",
  "endDate": "2024-06-30",
  "projectLeaderId": "emp-003",
  "status": "active"
}
```

### Security Audit (Kurzes Projekt)
```json
{
  "id": "proj-003",
  "name": "Q2 Security Audit",
  "startDate": "2024-05-01",
  "endDate": "2024-05-31",
  "projectLeaderId": "emp-002",
  "status": "active"
}
```

## Sample Employees

### Projektleiter
```json
{
  "id": "emp-001",
  "name": "Thomas Weber",
  "email": "t.weber@company.de",
  "role": "project_leader",
  "workload": 100,
  "status": "active"
}
```

### Senior Entwickler (Teilzeit)
```json
{
  "id": "emp-002",
  "name": "Maria Schmidt",
  "email": "m.schmidt@company.de",
  "role": "team_member",
  "workload": 80,
  "status": "active"
}
```

### UI/UX Designer
```json
{
  "id": "emp-003",
  "name": "Jan Müller",
  "email": "j.mueller@company.de",
  "role": "team_member",
  "workload": 100,
  "status": "active"
}
```

### Backend Entwickler
```json
{
  "id": "emp-004",
  "name": "Sarah Koch",
  "email": "s.koch@company.de",
  "role": "team_member",
  "workload": 100,
  "status": "active"
}
```

### Frontend Entwickler
```json
{
  "id": "emp-005",
  "name": "Michael Wagner",
  "email": "m.wagner@company.de",
  "role": "team_member",
  "workload": 100,
  "status": "active"
}
```

## Sample Assignments

### Website Relaunch Zuweisungen
```json
[
  {
    "id": "asg-001",
    "projectId": "proj-001",
    "employeeId": "emp-001",
    "startDate": "2024-03-01",
    "endDate": "2024-08-31",
    "workload": 30
  },
  {
    "id": "asg-002",
    "projectId": "proj-001",
    "employeeId": "emp-003",
    "startDate": "2024-03-01",
    "endDate": "2024-04-30",
    "workload": 100
  },
  {
    "id": "asg-003",
    "projectId": "proj-001",
    "employeeId": "emp-005",
    "startDate": "2024-04-01",
    "endDate": "2024-08-31",
    "workload": 80
  }
]
```

### Mobile App Zuweisungen
```json
[
  {
    "id": "asg-004",
    "projectId": "proj-002",
    "employeeId": "emp-003",
    "startDate": "2024-04-01",
    "endDate": "2024-06-30",
    "workload": 50
  },
  {
    "id": "asg-005",
    "projectId": "proj-002",
    "employeeId": "emp-004",
    "startDate": "2024-04-01",
    "endDate": "2024-06-30",
    "workload": 70
  }
]
```

### Security Audit Zuweisungen
```json
[
  {
    "id": "asg-006",
    "projectId": "proj-003",
    "employeeId": "emp-002",
    "startDate": "2024-05-01",
    "endDate": "2024-05-31",
    "workload": 60
  },
  {
    "id": "asg-007",
    "projectId": "proj-003",
    "employeeId": "emp-004",
    "startDate": "2024-05-01",
    "endDate": "2024-05-31",
    "workload": 30
  }
]
```

## Test Szenarien

### 1. Ressourcenauslastung
- Jan Müller arbeitet parallel an zwei Projekten
- Maria Schmidt ist Teilzeit (80%)
- Thomas Weber hat Projektleiter-Rolle mit 30% Auslastung

### 2. Projektkomplexität
- Langzeitprojekt (Website Relaunch, 6 Monate)
- Mittleres Projekt (Mobile App, 3 Monate)
- Kurzprojekt (Security Audit, 1 Monat)

### 3. Ressourcenkonflikte
- Sarah Koch hat überlappende Projekte im Mai
- Jan Müller wechselt direkt zwischen Projekten

### 4. Timeline-Visualisierung
- Verschiedene Projektlaufzeiten
- Parallele Zuweisungen
- Teilzeit-Mitarbeiter
- Projektübergänge

## SQL Insert Statements

```sql
-- Projects
INSERT INTO projects (id, name, start_date, end_date, project_leader_id, status)
VALUES 
  ('proj-001', 'Website Relaunch 2024', '2024-03-01', '2024-08-31', 'emp-001', 'active'),
  ('proj-002', 'Mobile App Version 2.0', '2024-04-01', '2024-06-30', 'emp-003', 'active'),
  ('proj-003', 'Q2 Security Audit', '2024-05-01', '2024-05-31', 'emp-002', 'active');

-- Employees
INSERT INTO employees (id, name, email, role, workload, status)
VALUES 
  ('emp-001', 'Thomas Weber', 't.weber@company.de', 'project_leader', 100, 'active'),
  ('emp-002', 'Maria Schmidt', 'm.schmidt@company.de', 'team_member', 80, 'active'),
  ('emp-003', 'Jan Müller', 'j.mueller@company.de', 'team_member', 100, 'active'),
  ('emp-004', 'Sarah Koch', 's.koch@company.de', 'team_member', 100, 'active'),
  ('emp-005', 'Michael Wagner', 'm.wagner@company.de', 'team_member', 100, 'active');

-- Assignments
INSERT INTO assignments (id, project_id, employee_id, start_date, end_date, workload)
VALUES 
  ('asg-001', 'proj-001', 'emp-001', '2024-03-01', '2024-08-31', 30),
  ('asg-002', 'proj-001', 'emp-003', '2024-03-01', '2024-04-30', 100),
  ('asg-003', 'proj-001', 'emp-005', '2024-04-01', '2024-08-31', 80),
  ('asg-004', 'proj-002', 'emp-003', '2024-04-01', '2024-06-30', 50),
  ('asg-005', 'proj-002', 'emp-004', '2024-04-01', '2024-06-30', 70),
  ('asg-006', 'proj-003', 'emp-002', '2024-05-01', '2024-05-31', 60),
  ('asg-007', 'proj-003', 'emp-004', '2024-05-01', '2024-05-31', 30);
```

## API Test Calls

### List All Projects
```bash
curl -X GET http://localhost:3000/api/projects
```

### Get Project Details
```bash
curl -X GET http://localhost:3000/api/projects/proj-001
```

### List Employee Assignments
```bash
curl -X GET http://localhost:3000/api/employees/emp-003/assignments
```

### Create New Assignment
```bash
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-001",
    "employeeId": "emp-004",
    "startDate": "2024-06-01",
    "endDate": "2024-07-31",
    "workload": 50
  }'
```

## Expected Timeline View

```
March 2024
- Website Relaunch: Thomas W. (30%), Jan M. (100%)

April 2024
- Website Relaunch: Thomas W. (30%), Michael W. (80%)
- Mobile App: Jan M. (50%), Sarah K. (70%)

May 2024
- Website Relaunch: Thomas W. (30%), Michael W. (80%)
- Mobile App: Jan M. (50%), Sarah K. (70%)
- Security Audit: Maria S. (60%), Sarah K. (30%)

June 2024
- Website Relaunch: Thomas W. (30%), Michael W. (80%)
- Mobile App: Jan M. (50%), Sarah K. (70%)

July-August 2024
- Website Relaunch: Thomas W. (30%), Michael W. (80%)
```

## Test Cases

### 1. Validation Tests
- Create assignment with workload > 100%
- Create overlapping assignments > 100%
- Create assignment outside project dates
- Create assignment for inactive employee

### 2. Timeline Tests
- Verify correct workload calculation
- Check color coding for different load levels
- Test timeline navigation and zooming
- Verify filter functionality

### 3. Resource Conflict Tests
- Attempt to overbook an employee
- Test conflict warning system
- Verify workload calculations
- Check notification system

### 4. UI/UX Tests
- Responsive design checks
- Drag-drop assignment creation
- Timeline scrolling performance
- Filter and search functionality