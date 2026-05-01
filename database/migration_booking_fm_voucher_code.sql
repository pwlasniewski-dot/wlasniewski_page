-- Booking: Foto-Match referral voucher code (zero-loss, additive)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fm_voucher_code VARCHAR(32);
CREATE INDEX IF NOT EXISTS bookings_fm_voucher_code_idx ON bookings(fm_voucher_code);
