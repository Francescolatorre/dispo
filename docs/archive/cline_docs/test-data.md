# Test Data Plan

## Sample Projects

### Website Relaunch (Komplexes Projekt)
```sql
INSERT INTO employees (
    name,
    employee_number,
    entry_date,
    email,
    phone,
    position,
    seniority_level,
    level_code,
    qualifications,
    work_time_factor,
    part_time_factor,
    status
) VALUES 
(
    'Thomas Weber',
    'EMP-2024-001',
    '2020-01-01',
    't.weber@company.de',
    '+49 123 456789',
    'Project Manager',
    'Senior',
    'PM3',
    ARRAY['Project Management', 'Agile', 'Scrum'],
    1.0,
    100.00,
    'active'
),
(
    'Maria Schmidt',
    'EMP-2024-002',
    '2021-03-15',
    'm.schmidt@company.de',
    '+49 123 456790',
    'Senior Developer',
    'Senior',
    'DEV4',
    ARRAY['Java', 'Spring', 'PostgreSQL'],
    0.8,
    80.00,
    'active'
),
(
    'Jan Müller',
    'EMP-2024-003',
    '2022-01-01',
    'j.mueller@company.de',
    '+49 123 456791',
    'UI/UX Designer',
    'Senior',
    'DES3',
    ARRAY['UI Design', 'UX Research', 'Figma'],
    1.0,
    100.00,
    'active'
),
(
    'Sarah Koch',
    'EMP-2024-004',
    '2023-06-01',
    's.koch@company.de',
    '+49 123 456792',
    'Backend Developer',
    'Mid',
    'DEV3',
    ARRAY['Python', 'Django', 'AWS'],
    1.0,
    100.00,
    'active'
),
(
    'Michael Wagner',
    'EMP-2024-005',
    '2023-01-15',
    'm.wagner@company.de',
    '+49 123 456793',
    'Frontend Developer',
    'Mid',
    'DEV3',
    ARRAY['React', 'TypeScript', 'Material-UI'],
    1.0,
    100.00,
    'active'
);

INSERT INTO projects (
    name,
    project_number,
    start_date,
    end_date,
    location,
    fte_count,
    project_manager_id,
    documentation_links,
    status
) VALUES 
(
    'Website Relaunch 2024',
    'PRJ-2024-001',
    '2024-03-01',
    '2024-08-31',
    'Berlin',
    3,
    1, -- Thomas Weber
    ARRAY['https://confluence.company.de/website-relaunch'],
    'active'
),
(
    'Mobile App Version 2.0',
    'PRJ-2024-002',
    '2024-04-01',
    '2024-06-30',
    'Hamburg',
    2,
    3, -- Jan Müller
    ARRAY['https://confluence.company.de/mobile-app-v2'],
    'active'
),
(
    'Q2 Security Audit',
    'PRJ-2024-003',
    '2024-05-01',
    '2024-05-31',
    'Berlin',
    2,
    2, -- Maria Schmidt
    ARRAY['https://confluence.company.de/security-audit-q2'],
    'active'
);

INSERT INTO project_assignments (
    project_id,
    employee_id,
    allocation_percentage,
    role,
    dr_status,
    position_status,
    start_date,
    end_date
) VALUES 
-- Website Relaunch Assignments
(1, 1, 30.00, 'Project Lead', 'DR1', 'P1', '2024-03-01', '2024-08-31'),  -- Thomas Weber
(1, 3, 100.00, 'Designer', 'DR2', 'P2', '2024-03-01', '2024-04-30'),     -- Jan Müller
(1, 5, 80.00, 'Developer', 'DR2', 'P2', '2024-04-01', '2024-08-31'),     -- Michael Wagner

-- Mobile App Assignments
(2, 3, 50.00, 'Project Lead', 'DR1', 'P1', '2024-04-01', '2024-06-30'),  -- Jan Müller
(2, 4, 70.00, 'Developer', 'DR2', 'P2', '2024-04-01', '2024-06-30'),     -- Sarah Koch

-- Security Audit Assignments
(3, 2, 60.00, 'Project Lead', 'DR1', 'P1', '2024-05-01', '2024-05-31'),  -- Maria Schmidt
(3, 4, 30.00, 'Security Expert', 'DR2', 'P2', '2024-05-01', '2024-05-31'); -- Sarah Koch

```

## Test Scenarios

### 1. Ressourcenauslastung
- Jan Müller arbeitet parallel an zwei Projekten (50% + 100%)
- Maria Schmidt ist Teilzeit (80%)
- Sarah Koch hat überlappende Zuweisungen im Mai

### 2. Projektkomplexität
- Langzeitprojekt (Website Relaunch, 6 Monate)
- Mittleres Projekt (Mobile App, 3 Monate)
- Kurzprojekt (Security Audit, 1 Monat)

### 3. Validierungstests
- Überlastung eines Mitarbeiters (>100%)
- Zuweisung außerhalb der Projektlaufzeit
- Ungültige Allokation (<0% oder >100%)
- Doppelte Zuweisungen im gleichen Zeitraum

### 4. Timeline-Visualisierung
```
März 2024
- Website Relaunch: Thomas W. (30%, DR1), Jan M. (100%, DR2)

April 2024
- Website Relaunch: Thomas W. (30%, DR1), Michael W. (80%, DR2)
- Mobile App: Jan M. (50%, DR1), Sarah K. (70%, DR2)

Mai 2024
- Website Relaunch: Thomas W. (30%, DR1), Michael W. (80%, DR2)
- Mobile App: Jan M. (50%, DR1), Sarah K. (70%, DR2)
- Security Audit: Maria S. (60%, DR1), Sarah K. (30%, DR2)

Juni 2024
- Website Relaunch: Thomas W. (30%, DR1), Michael W. (80%, DR2)
- Mobile App: Jan M. (50%, DR1), Sarah K. (70%, DR2)

Juli-August 2024
- Website Relaunch: Thomas W. (30%, DR1), Michael W. (80%, DR2)
```

## API Test Calls

### List All Projects
```bash
curl -X GET http://localhost:3000/api/projects
```

### Get Project Details
```bash
curl -X GET http://localhost:3000/api/projects/1
```

### List Employee Assignments
```bash
curl -X GET http://localhost:3000/api/employees/3/assignments
```

### Create New Assignment
```bash
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "employeeId": 4,
    "allocationPercentage": 50.00,
    "role": "Developer",
    "drStatus": "DR2",
    "positionStatus": "P2",
    "startDate": "2024-06-01",
    "endDate": "2024-07-31"
  }'
```

## Validation Cases

### 1. Data Integrity
- Mitarbeiter-IDs existieren
- Projekt-IDs existieren
- Gültige Datumsformate
- Gültige Prozentangaben

### 2. Business Rules
- Keine Überlastung (>100%)
- Zuweisungen innerhalb Projektlaufzeit
- Korrekte DR/Position Status
- Teilzeitfaktor-Berücksichtigung

### 3. Edge Cases
- Projektstart/-ende genau am Monatswechsel
- Mehrere gleichzeitige Zuweisungen
- Zuweisungen über Jahreswechsel
- Maximale Teamgröße