-- Beispielangaben für Tabelle employees
INSERT INTO employees (
  id, name, employee_number, entry_date, email, phone, position, 
  seniority_level, level_code, qualifications, work_time_factor, 
  contract_end_date, status, part_time_factor, created_at, updated_at
) VALUES
(
  1, 'Anna Müller', 'E2023-001', '2023-01-15', 'anna.mueller@example.com', 
  '+49 123 456 7890', 'Software Engineer', 'Junior', 'JR', 
  '{"JavaScript", "React", "Node.js"}', 1.0, 
  '2025-12-31', 'active', 1.0, '2023-01-15 09:00:00', '2023-01-15 09:00:00'
),
(
  2, 'Lukas Weber', 'E2023-002', '2023-03-01', 'lukas.weber@example.com', 
  '+49 123 456 7891', 'Frontend Developer', 'Mid', 'MID', 
  '{"TypeScript", "React", "CSS"}', 1.0, 
  '2025-12-31', 'active', 1.0, '2023-03-01 09:00:00', '2023-03-01 09:00:00'
),
(
  3, 'Sarah Braun', 'E2023-003', '2023-05-15', 'sarah.braun@example.com', 
  '+49 123 456 7892', 'Backend Developer', 'Senior', 'SR', 
  '{"Python", "Django", "PostgreSQL"}', 1.0, 
  '2025-12-31', 'active', 1.0, '2023-05-15 09:00:00', '2023-05-15 09:00:00'
),
(
  4, 'Michael Schmitz', 'E2023-004', '2023-07-01', 'michael.schmitz@example.com', 
  '+49 123 456 7893', 'Team Lead', 'Lead', 'LD', 
  '{"Leadership", "Agile", "Scrum"}', 1.0, 
  '2025-12-31', 'active', 1.0, '2023-07-01 09:00:00', '2023-07-01 09:00:00'
);
