ALTER TABLE "client_galleries"
    ADD COLUMN IF NOT EXISTS "event_video_url" TEXT,
    ADD COLUMN IF NOT EXISTS "event_video_title" TEXT,
    ADD COLUMN IF NOT EXISTS "event_video_description" TEXT,
    ADD COLUMN IF NOT EXISTS "event_video_enabled" BOOLEAN NOT NULL DEFAULT false;
