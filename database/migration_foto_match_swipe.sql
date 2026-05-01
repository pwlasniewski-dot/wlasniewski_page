-- Foto-Match: swipe table + lat/lng on profile (zero-loss, additive)

ALTER TABLE foto_match_profile ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE foto_match_profile ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS foto_match_swipe (
    id              SERIAL PRIMARY KEY,
    from_profile_id INTEGER NOT NULL REFERENCES foto_match_profile(id) ON DELETE CASCADE,
    to_profile_id   INTEGER NOT NULL REFERENCES foto_match_profile(id) ON DELETE CASCADE,
    action          VARCHAR(20) NOT NULL,
    is_match        BOOLEAN NOT NULL DEFAULT FALSE,
    matched_at      TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT foto_match_swipe_unique UNIQUE (from_profile_id, to_profile_id)
);

CREATE INDEX IF NOT EXISTS foto_match_swipe_from_action_idx ON foto_match_swipe(from_profile_id, action);
CREATE INDEX IF NOT EXISTS foto_match_swipe_to_action_idx ON foto_match_swipe(to_profile_id, action);
CREATE INDEX IF NOT EXISTS foto_match_swipe_is_match_idx ON foto_match_swipe(is_match);
