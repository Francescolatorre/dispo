-- Add workload warning column to project_assignments
ALTER TABLE project_assignments
ADD COLUMN IF NOT EXISTS workload_warning BOOLEAN DEFAULT false;

-- Update existing assignments to set workload_warning based on current workload
-- This is left empty intentionally as we'll handle existing assignments through the service layer
-- to ensure consistent business logic application