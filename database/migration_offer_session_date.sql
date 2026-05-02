-- Offer.session_date + powiązane: kanoniczna data sesji (nie valid_until!)
-- Wcześniej eventDate był luźnym stringiem w template_data Json. Tu dodajemy strukturalne kolumny + indeks.
-- Backfill robi internal_scripts/backfill_offer_session_dates.ts

ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "session_date" TIMESTAMP(3);
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "session_time" VARCHAR(10);
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "session_duration_min" INTEGER;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "session_location" TEXT;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "photographer_id" INTEGER;

CREATE INDEX IF NOT EXISTS "offers_session_date_idx" ON "offers"("session_date");

DO $$ BEGIN
  ALTER TABLE "offers"
    ADD CONSTRAINT "offers_photographer_id_fkey"
    FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
