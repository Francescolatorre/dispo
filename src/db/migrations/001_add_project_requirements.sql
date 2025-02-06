-- Create project_requirements table
CREATE TABLE IF NOT EXISTS project_requirements (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(255) NOT NULL,
    seniority_level VARCHAR(50) NOT NULL,
    required_qualifications TEXT[] NOT NULL DEFAULT '{}',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    notes TEXT,
    current_assignment_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_requirement_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_requirement_status CHECK (status IN ('open', 'partially_filled', 'filled', 'needs_replacement')),
    CONSTRAINT valid_requirement_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_seniority_level CHECK (seniority_level IN ('Junior', 'Mid', 'Senior', 'Lead'))
);

-- Add new columns to project_assignments
ALTER TABLE project_assignments
    ADD COLUMN IF NOT EXISTS requirement_id INTEGER REFERENCES project_requirements(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS termination_reason TEXT,
    ADD CONSTRAINT valid_assignment_status CHECK (status IN ('active', 'completed', 'terminated'));

-- Create trigger function to update requirement status
CREATE OR REPLACE FUNCTION update_requirement_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new active assignment
    IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR
       (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active') THEN
        UPDATE project_requirements
        SET status = 'filled',
            current_assignment_id = NEW.id
        WHERE id = NEW.requirement_id;
    
    -- If an active assignment is being terminated/completed
    ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') THEN
        UPDATE project_requirements
        SET status = 'needs_replacement',
            current_assignment_id = NULL
        WHERE id = NEW.requirement_id;
    
    -- If an assignment is being deleted
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE project_requirements
        SET status = 
            CASE 
                WHEN current_assignment_id = OLD.id THEN 'needs_replacement'
                ELSE status
            END,
            current_assignment_id = 
            CASE 
                WHEN current_assignment_id = OLD.id THEN NULL
                ELSE current_assignment_id
            END
        WHERE id = OLD.requirement_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for assignment status changes
DROP TRIGGER IF EXISTS assignment_status_trigger ON project_assignments;
CREATE TRIGGER assignment_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_requirement_status();

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_requirement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
DROP TRIGGER IF EXISTS update_project_requirements_timestamp ON project_requirements;
CREATE TRIGGER update_project_requirements_timestamp
    BEFORE UPDATE ON project_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_requirement_timestamp();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_requirements_project_id ON project_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_project_requirements_status ON project_requirements(status);
CREATE INDEX IF NOT EXISTS idx_project_assignments_requirement_id ON project_assignments(requirement_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_status ON project_assignments(status);