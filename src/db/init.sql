-- Create employees table first since projects will reference it
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  employee_number VARCHAR(20) UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100) NOT NULL,
  seniority_level VARCHAR(50) NOT NULL,
  level_code VARCHAR(10) NOT NULL,
  qualifications TEXT[] NOT NULL DEFAULT '{}',
  work_time_factor DECIMAL(3,2) NOT NULL CHECK (work_time_factor > 0 AND work_time_factor <= 1),
  contract_end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  part_time_factor DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (part_time_factor BETWEEN 0.00 AND 100.00),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table with foreign key to employees for project manager
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  project_number VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location VARCHAR(100) NOT NULL,
  fte_count INTEGER NOT NULL,
  project_manager_id INTEGER NOT NULL REFERENCES employees(id),
  documentation_links TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_date >= start_date)
);

-- Create junction table for employee-project assignments
CREATE TABLE IF NOT EXISTS project_assignments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  allocation_percentage DECIMAL(5,2) NOT NULL CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  CONSTRAINT valid_allocation_percentage CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  role VARCHAR(255),
  dr_status VARCHAR(10),
  position_status VARCHAR(10),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_date >= start_date),
  CONSTRAINT assignment_within_project_dates FOREIGN KEY (project_id)
    REFERENCES projects(id)
    DEFERRABLE INITIALLY DEFERRED,
  UNIQUE(project_id, employee_id, start_date, end_date)
);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function to validate assignment dates
CREATE OR REPLACE FUNCTION validate_assignment_dates()
RETURNS TRIGGER AS $$
DECLARE
  project_start DATE;
  project_end DATE;
BEGIN
  SELECT start_date, end_date INTO project_start, project_end
  FROM projects WHERE id = NEW.project_id;

  IF NEW.start_date < project_start OR NEW.end_date > project_end THEN
    RAISE EXCEPTION 'Assignment dates must fall within project timeline';
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for assignment date validation
DROP TRIGGER IF EXISTS validate_assignment_dates_trigger ON project_assignments;
CREATE TRIGGER validate_assignment_dates_trigger
  BEFORE INSERT OR UPDATE ON project_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_assignment_dates();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_assignments_updated_at ON project_assignments;
CREATE TRIGGER update_project_assignments_updated_at
  BEFORE UPDATE ON project_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
