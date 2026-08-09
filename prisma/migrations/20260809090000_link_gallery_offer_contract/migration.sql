ALTER TABLE "client_galleries"
    ADD COLUMN IF NOT EXISTS "offer_id" INTEGER,
    ADD COLUMN IF NOT EXISTS "contract_id" INTEGER,
    ADD COLUMN IF NOT EXISTS "package_snapshot" JSONB,
    ADD COLUMN IF NOT EXISTS "terms_source" TEXT NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN IF NOT EXISTS "terms_locked_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "client_galleries_offer_id_key" ON "client_galleries"("offer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "client_galleries_contract_id_key" ON "client_galleries"("contract_id");

DO $$ BEGIN
    ALTER TABLE "client_galleries"
        ADD CONSTRAINT "client_galleries_offer_id_fkey"
        FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "client_galleries"
        ADD CONSTRAINT "client_galleries_contract_id_fkey"
        FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
