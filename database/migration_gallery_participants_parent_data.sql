-- Migration: Add parent data fields to gallery_participants
-- Date: 2026-05-18
-- Purpose: Store parent's personal data for electronic consent (GDPR compliant)

ALTER TABLE gallery_participants 
ADD COLUMN parent_name VARCHAR(255),
ADD COLUMN parent_email VARCHAR(255),
ADD COLUMN parent_phone VARCHAR(50),
ADD COLUMN first_login_at TIMESTAMP;

COMMENT ON COLUMN gallery_participants.parent_name IS 'Imię i nazwisko rodzica (wymagane dla zgody elektronicznej)';
COMMENT ON COLUMN gallery_participants.parent_email IS 'Email rodzica (opcjonalny)';
COMMENT ON COLUMN gallery_participants.parent_phone IS 'Telefon rodzica (opcjonalny)';
COMMENT ON COLUMN gallery_participants.first_login_at IS 'Data pierwszego logowania rodzica';
