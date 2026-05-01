-- =====================================================================
-- Foto-Match / Bookings: Split Payment 50/50.
-- Idempotent. Aplikowane przez scripts/apply_split_payment.js
-- =====================================================================

-- 1) Bookings: pola na zaliczkę i płatność końcową.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_plan VARCHAR(20) DEFAULT 'FULL';
-- 'FULL' (jednorazowa) | 'SPLIT' (50/50)

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_amount INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_session_id VARCHAR(255);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_amount INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_paid_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_session_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_due_at TIMESTAMP;

-- 2) Settings: globalny toggle + procent zaliczki.
ALTER TABLE settings ADD COLUMN IF NOT EXISTS split_payment_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS split_payment_deposit_percent INTEGER DEFAULT 50;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS split_payment_remaining_due_days INTEGER DEFAULT 7;
-- Dni przed sesją kiedy klient musi dopłacić resztę.
