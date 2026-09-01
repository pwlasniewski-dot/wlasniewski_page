-- Package-scoped promotions with an auditable 30-day price reference.
-- Additive migration: no current package or price is changed and every
-- promotion starts disabled until an administrator completes the legal data.

CREATE TABLE "package_price_history" (
  "id" SERIAL NOT NULL,
  "package_id" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "valid_to" TIMESTAMP(3),
  "source" TEXT NOT NULL DEFAULT 'SYSTEM',
  "verified" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "package_price_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "package_price_history_package_id_fkey"
    FOREIGN KEY ("package_id") REFERENCES "packages"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "package_price_history_price_check" CHECK ("price" > 0),
  CONSTRAINT "package_price_history_source_check"
    CHECK ("source" IN ('SYSTEM', 'MIGRATION_BASELINE', 'ADMIN_CORRECTION')),
  CONSTRAINT "package_price_history_period_check"
    CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from")
);

CREATE INDEX "package_price_history_package_id_valid_from_idx"
  ON "package_price_history"("package_id", "valid_from");

CREATE UNIQUE INDEX "package_price_history_one_open_row_idx"
  ON "package_price_history"("package_id")
  WHERE "valid_to" IS NULL;

CREATE TABLE "package_promotions" (
  "id" SERIAL NOT NULL,
  "package_id" INTEGER NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "discount_type" TEXT NOT NULL,
  "discount_value" INTEGER NOT NULL,
  "regular_price_snapshot" INTEGER NOT NULL,
  "promotional_price" INTEGER NOT NULL,
  "lowest_price_30d" INTEGER NOT NULL,
  "lowest_price_source" TEXT NOT NULL,
  "lowest_price_confirmed_at" TIMESTAMP(3) NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Promocja',
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3),
  "allow_promo_code" BOOLEAN NOT NULL DEFAULT FALSE,
  "show_on_home" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "package_promotions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "package_promotions_package_id_fkey"
    FOREIGN KEY ("package_id") REFERENCES "packages"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "package_promotions_discount_type_check"
    CHECK ("discount_type" IN ('percentage', 'fixed')),
  CONSTRAINT "package_promotions_discount_value_check"
    CHECK (
      ("discount_type" = 'percentage' AND "discount_value" BETWEEN 1 AND 99)
      OR
      ("discount_type" = 'fixed' AND "discount_value" > 0)
    ),
  CONSTRAINT "package_promotions_price_check"
    CHECK (
      "regular_price_snapshot" > 0
      AND "promotional_price" > 0
      AND "lowest_price_30d" > 0
      AND "promotional_price" < "regular_price_snapshot"
      AND "promotional_price" < "lowest_price_30d"
    ),
  CONSTRAINT "package_promotions_calculation_check"
    CHECK (
      ("discount_type" = 'percentage'
        AND "promotional_price" = "regular_price_snapshot"
          - (("regular_price_snapshot" * "discount_value") / 100))
      OR
      ("discount_type" = 'fixed'
        AND "promotional_price" = "regular_price_snapshot" - "discount_value")
    ),
  CONSTRAINT "package_promotions_reference_source_check"
    CHECK ("lowest_price_source" IN ('AUTO_HISTORY', 'ADMIN_CONFIRMED')),
  CONSTRAINT "package_promotions_period_check"
    CHECK ("ends_at" IS NULL OR "ends_at" > "starts_at"),
  CONSTRAINT "package_promotions_label_check"
    CHECK (char_length(btrim("label")) BETWEEN 1 AND 48)
);

CREATE INDEX "package_promotions_package_id_starts_at_idx"
  ON "package_promotions"("package_id", "starts_at");

CREATE INDEX "package_promotions_enabled_period_idx"
  ON "package_promotions"("is_enabled", "starts_at", "ends_at");

-- We know the current public price, but the old application did not record how
-- long it had been in force. Therefore this baseline is deliberately marked as
-- unverified and cannot by itself prove a complete 30-day history.
INSERT INTO "package_price_history"
  ("package_id", "price", "valid_from", "source", "verified")
SELECT p."id", p."price", CURRENT_TIMESTAMP, 'MIGRATION_BASELINE', FALSE
FROM "packages" p;

CREATE OR REPLACE FUNCTION "record_package_regular_price_history"()
RETURNS TRIGGER AS $$
DECLARE
  open_row "package_price_history"%ROWTYPE;
  changed_at TIMESTAMP(3) := CURRENT_TIMESTAMP;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "package_price_history"
      ("package_id", "price", "valid_from", "source", "verified")
    VALUES (NEW."id", NEW."price", changed_at, 'SYSTEM', TRUE)
    ON CONFLICT DO NOTHING;
  ELSIF NEW."price" IS DISTINCT FROM OLD."price" THEN
    SELECT * INTO open_row
    FROM "package_price_history"
    WHERE "package_id" = NEW."id" AND "valid_to" IS NULL
    FOR UPDATE;

    IF FOUND AND open_row."valid_from" >= changed_at THEN
      UPDATE "package_price_history"
      SET "price" = NEW."price", "source" = 'SYSTEM', "verified" = TRUE
      WHERE "id" = open_row."id";
    ELSE
      UPDATE "package_price_history"
      SET "valid_to" = changed_at
      WHERE "package_id" = NEW."id" AND "valid_to" IS NULL;

      INSERT INTO "package_price_history"
        ("package_id", "price", "valid_from", "source", "verified")
      VALUES (NEW."id", NEW."price", changed_at, 'SYSTEM', TRUE);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "packages_record_regular_price_history"
AFTER INSERT OR UPDATE OF "price" ON "packages"
FOR EACH ROW EXECUTE FUNCTION "record_package_regular_price_history"();
