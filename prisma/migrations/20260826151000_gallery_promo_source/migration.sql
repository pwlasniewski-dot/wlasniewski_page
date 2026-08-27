-- A gallery loyalty benefit must reference the same PromoCode record that is
-- validated by the reservation and checkout flow. Existing codes stay hidden.
ALTER TABLE "promo_codes"
  ADD COLUMN "show_in_gallery" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "show_in_banner" BOOLEAN NOT NULL DEFAULT false;

-- Preserve an actually configured legacy banner when it already points at a
-- valid PromoCode. We intentionally do not invent a code or enable the former
-- hard-coded gallery discount.
WITH legacy_banner AS (
  SELECT
    COALESCE((
      SELECT "promo_code_discount_enabled"
      FROM "settings"
      ORDER BY "id" ASC
      LIMIT 1
    ), false) AS enabled,
    NULLIF(BTRIM((
      SELECT "setting_value"
      FROM "settings"
      WHERE "setting_key" = 'promo_code'
      ORDER BY "id" ASC
      LIMIT 1
    )), '') AS code
)
UPDATE "promo_codes" AS promo
SET "show_in_banner" = true
FROM legacy_banner AS legacy
WHERE legacy.enabled = true
  AND legacy.code IS NOT NULL
  AND UPPER(promo."code") = UPPER(legacy.code)
  AND promo."is_active" = true
  AND promo."valid_from" <= NOW()
  AND (promo."valid_until" IS NULL OR promo."valid_until" >= NOW());
