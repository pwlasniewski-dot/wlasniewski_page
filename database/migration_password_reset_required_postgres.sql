-- Migration: Add password_reset_required flag to users (PostgreSQL)
-- Date: 2026-05-18
-- Purpose: Allow admins to force password reset after security incidents (e.g., SMTP breach)

ALTER TABLE users 
ADD COLUMN password_reset_required BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN users.password_reset_required IS 'Flaga wymuszająca reset hasła po incydencie bezpieczeństwa';
