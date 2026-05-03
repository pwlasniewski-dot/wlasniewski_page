-- Add public_signup_enabled field to workshops table
ALTER TABLE workshops ADD COLUMN public_signup_enabled BOOLEAN NOT NULL DEFAULT true;

-- Set default value for existing workshops
UPDATE workshops SET public_signup_enabled = true WHERE public_signup_enabled IS NULL;
