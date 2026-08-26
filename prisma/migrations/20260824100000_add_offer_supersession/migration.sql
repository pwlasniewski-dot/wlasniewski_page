ALTER TABLE "offers"
    ADD COLUMN "superseded_by_offer_id" INTEGER,
    ADD COLUMN "superseded_at" TIMESTAMP(3),
    ADD COLUMN "superseded_reason" TEXT;

CREATE INDEX "offers_superseded_by_offer_id_idx"
    ON "offers"("superseded_by_offer_id");

ALTER TABLE "offers"
    ADD CONSTRAINT "offers_superseded_by_offer_id_fkey"
    FOREIGN KEY ("superseded_by_offer_id") REFERENCES "offers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
