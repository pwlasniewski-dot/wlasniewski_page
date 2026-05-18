-- Migration: Add password_reset_required flag to users
-- Date: 2026-05-18
-- Purpose: Allow admins to force password reset after security incidents (e.g., SMTP breach)

ALTER TABLE `users` 
ADD COLUMN `password_reset_required` BOOLEAN NOT NULL DEFAULT FALSE 
COMMENT 'Flaga wymuszająca reset hasła po incydencie bezpieczeństwa';

-- Optional: Set flag for all existing users (uncomment if needed after SMTP breach)
-- UPDATE `users` SET `password_reset_required` = TRUE WHERE `role` = 'CLIENT';
