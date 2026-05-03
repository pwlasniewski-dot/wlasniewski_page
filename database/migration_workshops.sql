-- Migracja: Warsztaty fotograficzne (Workshop, WorkshopParticipant, WorkshopUpload)
-- Bez maila uczestnikow (RODO dla dzieci) - login warsztatowy + PIN.

CREATE TABLE IF NOT EXISTS "workshops" (
  "id" SERIAL PRIMARY KEY,
  "slug" VARCHAR(80) NOT NULL UNIQUE,
  "title" VARCHAR(160) NOT NULL,
  "location" VARCHAR(160),
  "description" TEXT,
  "schedule" JSONB DEFAULT '[]'::jsonb,
  "materials" JSONB DEFAULT '[]'::jsonb,
  "host_user_id" INTEGER,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
  "starts_at" TIMESTAMP(3),
  "ends_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "workshops_status_idx" ON "workshops"("status");
CREATE INDEX IF NOT EXISTS "workshops_starts_at_idx" ON "workshops"("starts_at");

CREATE TABLE IF NOT EXISTS "workshop_participants" (
  "id" SERIAL PRIMARY KEY,
  "workshop_id" INTEGER NOT NULL REFERENCES "workshops"("id") ON DELETE CASCADE,
  "login" VARCHAR(40) NOT NULL,
  "pin_hash" VARCHAR(120) NOT NULL,
  "pin_plain_temp" VARCHAR(20),
  "display_name" VARCHAR(60),
  "avatar" VARCHAR(40),
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "last_login" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workshop_participants_workshop_login_key" UNIQUE ("workshop_id", "login")
);
CREATE INDEX IF NOT EXISTS "workshop_participants_workshop_idx" ON "workshop_participants"("workshop_id");

CREATE TABLE IF NOT EXISTS "workshop_uploads" (
  "id" SERIAL PRIMARY KEY,
  "workshop_id" INTEGER NOT NULL REFERENCES "workshops"("id") ON DELETE CASCADE,
  "participant_id" INTEGER NOT NULL REFERENCES "workshop_participants"("id") ON DELETE CASCADE,
  "file_url" VARCHAR(500) NOT NULL,
  "thumb_url" VARCHAR(500),
  "caption" TEXT,
  "feedback" TEXT,
  "rating" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "workshop_uploads_workshop_idx" ON "workshop_uploads"("workshop_id");
CREATE INDEX IF NOT EXISTS "workshop_uploads_participant_idx" ON "workshop_uploads"("participant_id");
