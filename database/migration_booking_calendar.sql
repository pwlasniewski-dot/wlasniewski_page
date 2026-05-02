-- Booking calendar sync fields (Google Calendar, iCal)
-- Run: psql $DATABASE_URL -f database/migration_booking_calendar.sql

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS google_event_id    VARCHAR(120),
  ADD COLUMN IF NOT EXISTS google_calendar_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS ics_uid            VARCHAR(80),
  ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_ics_uid_key ON bookings(ics_uid);

-- Backfill ics_uid for existing bookings
UPDATE bookings
SET ics_uid = 'booking-' || id::text || '@wlasniewski.pl'
WHERE ics_uid IS NULL;
