-- =============================================================
-- FOTO-MATCH FAZA 1 — profil użytkownika + zdjęcia.
-- Migracja addytywna, ZERO LOSS. Można odpalać wielokrotnie.
--
-- Powiązania:
--   foto_match_profile.user_id → users.id (1:1, ON DELETE CASCADE)
--   foto_match_photo.profile_id → foto_match_profile.id (N:1, ON DELETE CASCADE)
--
-- Reguły biznesowe:
--   - Pani Kowalska ze ślubu nie ma profilu Foto-Match → po prostu nie istnieje
--     wpis w foto_match_profile. Brak duplikatów users.
--   - status: PENDING (po onboardingu) → ACTIVE (po akceptacji admina)
--             | SUSPENDED | DELETED
--   - is_active = true tylko gdy status = ACTIVE
--
-- Rollback (jeśli trzeba cofnąć MVP):
--   DROP TABLE IF EXISTS foto_match_photo;
--   DROP TABLE IF EXISTS foto_match_profile;
-- =============================================================

CREATE TABLE IF NOT EXISTS "foto_match_profile" (
    "id"                SERIAL PRIMARY KEY,
    "user_id"           INTEGER NOT NULL UNIQUE,

    -- Profil podstawowy
    "display_name"      VARCHAR(60) NOT NULL,
    "birth_year"        INTEGER NOT NULL,
    "gender"            VARCHAR(20) NOT NULL,
    "city"              VARCHAR(60) NOT NULL,
    "radius_km"         INTEGER NOT NULL DEFAULT 30,
    "bio"               TEXT,
    "interests"         TEXT[] NOT NULL DEFAULT '{}',
    "experience"        VARCHAR(40),
    "comfort_level"     VARCHAR(40),

    -- Weryfikacja tożsamości (manual przez admina)
    "selfie_url"        TEXT,
    "id_doc_url"        TEXT,
    "verified_at"       TIMESTAMP(3),
    "verified_by"       INTEGER,
    "rejection_reason"  TEXT,

    -- Moderacja / status
    "status"            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "is_active"         BOOLEAN NOT NULL DEFAULT FALSE,
    "flagged_count"     INTEGER NOT NULL DEFAULT 0,

    -- Metryki
    "last_active"       TIMESTAMP(3),
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foto_match_profile_user_fk"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "foto_match_profile_status_idx"
    ON "foto_match_profile" ("status");

CREATE INDEX IF NOT EXISTS "foto_match_profile_city_idx"
    ON "foto_match_profile" ("city");

CREATE INDEX IF NOT EXISTS "foto_match_profile_is_active_idx"
    ON "foto_match_profile" ("is_active");

CREATE INDEX IF NOT EXISTS "foto_match_profile_created_at_idx"
    ON "foto_match_profile" ("created_at");


-- =============================================================
-- ZDJĘCIA PROFILOWE (3-6 per profil)
-- =============================================================

CREATE TABLE IF NOT EXISTS "foto_match_photo" (
    "id"                SERIAL PRIMARY KEY,
    "profile_id"        INTEGER NOT NULL,
    "url"               TEXT NOT NULL,
    "position"          INTEGER NOT NULL DEFAULT 0,

    -- AI moderacja (AWS Rekognition)
    "ai_status"         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "ai_labels"         JSONB,
    "ai_flagged_for"    TEXT,

    -- Manual review (admin)
    "reviewed_by"       INTEGER,
    "reviewed_at"       TIMESTAMP(3),
    "review_notes"      TEXT,

    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foto_match_photo_profile_fk"
        FOREIGN KEY ("profile_id") REFERENCES "foto_match_profile"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "foto_match_photo_profile_idx"
    ON "foto_match_photo" ("profile_id");

CREATE INDEX IF NOT EXISTS "foto_match_photo_ai_status_idx"
    ON "foto_match_photo" ("ai_status");
