-- AlterTable
ALTER TABLE "client_galleries" ADD COLUMN "external_download_url" TEXT;

-- Preserve the link already configured in the application for this existing gallery.
UPDATE "client_galleries"
SET "external_download_url" = 'https://adobe.ly/4vUBLpv'
WHERE "group_access_code" = 'TORUNAB'
  AND "external_download_url" IS NULL;
