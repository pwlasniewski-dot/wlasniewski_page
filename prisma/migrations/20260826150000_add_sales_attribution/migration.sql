-- Nullable attribution columns preserve existing inquiries and bookings while
-- allowing canonical CRM records to be connected to consented analytics sessions.
ALTER TABLE "inquiries"
  ADD COLUMN "analytics_session_id" VARCHAR(120),
  ADD COLUMN "landing_page" VARCHAR(500),
  ADD COLUMN "utm_source" VARCHAR(80),
  ADD COLUMN "utm_medium" VARCHAR(80),
  ADD COLUMN "utm_campaign" VARCHAR(80),
  ADD COLUMN "city_slug" VARCHAR(120),
  ADD COLUMN "package_slug" VARCHAR(120);

ALTER TABLE "bookings"
  ADD COLUMN "analytics_session_id" VARCHAR(120),
  ADD COLUMN "landing_page" VARCHAR(500),
  ADD COLUMN "utm_source" VARCHAR(80),
  ADD COLUMN "utm_medium" VARCHAR(80),
  ADD COLUMN "utm_campaign" VARCHAR(80);

CREATE INDEX "inquiries_analytics_session_id_idx" ON "inquiries"("analytics_session_id");
CREATE INDEX "inquiries_source_created_at_idx" ON "inquiries"("source", "created_at");
CREATE INDEX "bookings_analytics_session_id_idx" ON "bookings"("analytics_session_id");
