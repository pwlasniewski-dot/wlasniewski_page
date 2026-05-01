-- =============================================================
-- FOTO-MATCH waitlist — migracja addytywna (zero-loss).
--
-- Bezpieczeństwo:
--  - Tylko CREATE (brak ALTER/DROP/UPDATE na istniejących tabelach).
--  - IF NOT EXISTS na wszystkich obiektach — można odpalić wielokrotnie.
--  - Nie dotyka żadnej z istniejących tabel ani danych.
--
-- Jak odpalić (Neon/Postgres):
--  1) Backup bazy (snapshot Neon UI lub pg_dump) — punkt powrotu.
--  2) Odpal w psql / Neon SQL editor:
--       \i database/migration_foto_match_waitlist.sql
--  3) Weryfikacja:
--       SELECT 1 FROM foto_match_waitlist LIMIT 1;
--       \d foto_match_waitlist
--  4) Po sukcesie restart Netlify (żeby Prisma client podchwycił schema).
--
-- Rollback (gdyby trzeba cofnąć MVP):
--   DROP TABLE IF EXISTS foto_match_waitlist;
-- =============================================================

CREATE TABLE IF NOT EXISTS "foto_match_waitlist" (
    "id"                    SERIAL PRIMARY KEY,
    "email"                 TEXT NOT NULL,
    "city"                  TEXT,
    "role"                  TEXT,
    "age_range"             TEXT,
    "source"                TEXT,
    "marketing_opt_in"      BOOLEAN NOT NULL DEFAULT FALSE,
    "rules_accepted_at"     TIMESTAMP(3),
    "ip_address"            TEXT,
    "user_agent"            TEXT,
    "confirm_token"         TEXT,
    "confirm_token_expires" TIMESTAMP(3),
    "confirmed_at"          TIMESTAMP(3),
    "unsubscribed_at"       TIMESTAMP(3),
    "notes"                 TEXT,
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "foto_match_waitlist_email_key"
    ON "foto_match_waitlist" ("email");

CREATE UNIQUE INDEX IF NOT EXISTS "foto_match_waitlist_confirm_token_key"
    ON "foto_match_waitlist" ("confirm_token");

CREATE INDEX IF NOT EXISTS "foto_match_waitlist_city_idx"
    ON "foto_match_waitlist" ("city");

CREATE INDEX IF NOT EXISTS "foto_match_waitlist_confirmed_at_idx"
    ON "foto_match_waitlist" ("confirmed_at");

CREATE INDEX IF NOT EXISTS "foto_match_waitlist_created_at_idx"
    ON "foto_match_waitlist" ("created_at");
