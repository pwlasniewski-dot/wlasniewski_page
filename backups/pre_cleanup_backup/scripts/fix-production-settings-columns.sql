-- EMERGENCY FIX: Add missing columns to settings table on production
-- Problem: Columns like social_proof_enabled don't exist in production database
-- This causes P2022 errors when trying to query settings

-- Add social_proof_enabled if it doesn't exist
ALTER TABLE settings ADD COLUMN IF NOT EXISTS social_proof_enabled BOOLEAN DEFAULT true;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND column_name IN ('social_proof_enabled', 'urgency_enabled', 'gift_card_promo_enabled');

-- List all columns in settings table for reference
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;
