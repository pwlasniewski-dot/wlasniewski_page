CREATE TABLE "google_calendar_integration" (
 "id" INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), "account_id" TEXT, "email" TEXT,
 "refresh_token" TEXT, "connected" BOOLEAN NOT NULL DEFAULT false,
 "revision" INTEGER NOT NULL DEFAULT 1, "synced_revision" INTEGER NOT NULL DEFAULT 0,
 "lease_token" TEXT, "lease_until" TIMESTAMP(3), "last_sync_at" TIMESTAMP(3),
 "last_error" TEXT, "stats" JSONB
);
INSERT INTO "google_calendar_integration" (id) VALUES (1);
CREATE TABLE "google_calendar_event_maps" (
 "account_id" TEXT NOT NULL, "source_key" TEXT NOT NULL, "event_id" TEXT NOT NULL,
 "event_date" TEXT NOT NULL, "content_hash" TEXT NOT NULL, "cancelled" BOOLEAN NOT NULL DEFAULT false,
 PRIMARY KEY ("account_id", "source_key"), UNIQUE ("account_id", "event_id")
);
CREATE FUNCTION mark_google_calendar_dirty() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 UPDATE google_calendar_integration SET revision = revision + 1 WHERE id = 1 AND connected = true;
 RETURN NULL;
END $$;
DO $$ DECLARE source_table TEXT; BEGIN
 FOREACH source_table IN ARRAY ARRAY['bookings','offers','contracts','photo_challenges','workshops','users','challenge_packages','challenge_locations'] LOOP
  IF to_regclass('public.' || source_table) IS NOT NULL THEN
   EXECUTE format('CREATE TRIGGER google_calendar_dirty AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH STATEMENT EXECUTE FUNCTION mark_google_calendar_dirty()', source_table);
  END IF;
 END LOOP;
END $$;
