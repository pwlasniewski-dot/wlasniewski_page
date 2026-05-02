-- Photographer profile public fields + toggles + Google Calendar
-- Run: psql $DATABASE_URL -f database/migration_photographer_toggles.sql

ALTER TABLE photographer_profiles
  ADD COLUMN IF NOT EXISTS display_name             VARCHAR(80),
  ADD COLUMN IF NOT EXISTS slug                     VARCHAR(80),
  ADD COLUMN IF NOT EXISTS is_active                BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS available_for_bookings   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS available_for_foto_match BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS available_for_challenges BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS google_calendar_id       VARCHAR(120),
  ADD COLUMN IF NOT EXISTS google_refresh_token     TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS photographer_profiles_slug_key ON photographer_profiles(slug);

-- Aktywuj profile fotografów którzy mają user (logujących)
UPDATE photographer_profiles pp
SET is_active = TRUE,
    available_for_bookings = TRUE,
    display_name = COALESCE(pp.display_name, u.name, 'Fotograf'),
    slug = COALESCE(pp.slug, LOWER(REGEXP_REPLACE(COALESCE(u.name, 'fotograf-' || pp.id::text), '[^a-zA-Z0-9]+', '-', 'g')))
FROM users u
WHERE u.photographer_profile_id = pp.id
  AND u.role IN ('PHOTOGRAPHER', 'ADMIN');
