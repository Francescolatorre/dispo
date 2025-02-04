-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    project_leader_id INTEGER REFERENCES users(id),
    documentation_links TEXT[],
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    seniority_level VARCHAR(50) NOT NULL,
    qualifications TEXT[],
    work_time_factor DECIMAL(3,2) CHECK (work_time_factor > 0 AND work_time_factor <= 1.0),
    contract_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create absences table
CREATE TABLE IF NOT EXISTS absences (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    absence_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create project_assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    employee_id INTEGER REFERENCES employees(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    allocation_percentage INTEGER CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_projects_timestamp
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_employees_timestamp
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_project_assignments_timestamp
    BEFORE UPDATE ON project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
