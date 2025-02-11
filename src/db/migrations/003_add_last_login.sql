-- Add last_login column to users table
ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Update existing users with current timestamp
UPDATE users SET last_login = NOW();

-- Add trigger to update last_login on successful login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_login = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_login_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION update_last_login();