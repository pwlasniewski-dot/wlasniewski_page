-- Contract.session_date + powiązane: dla kontraktów standalone (bez powiązanej oferty)
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "session_date" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "session_time" VARCHAR(10);
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "session_location" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "photographer_id" INTEGER;

CREATE INDEX IF NOT EXISTS "contracts_session_date_idx" ON "contracts"("session_date");

DO $$ BEGIN
  ALTER TABLE "contracts"
    ADD CONSTRAINT "contracts_photographer_id_fkey"
    FOREIGN KEY ("photographer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
