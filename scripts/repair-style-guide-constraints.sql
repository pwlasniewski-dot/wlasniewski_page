DO $audit$
BEGIN
-- Verified on the audit branch. Abort on any incomplete record; never invent missing data.
ALTER TABLE outfit_sets ALTER COLUMN is_featured SET NOT NULL, ALTER COLUMN is_active SET NOT NULL, ALTER COLUMN display_order SET NOT NULL, ALTER COLUMN created_at SET NOT NULL, ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE style_guide_tips ALTER COLUMN is_featured SET NOT NULL, ALTER COLUMN is_active SET NOT NULL, ALTER COLUMN display_order SET NOT NULL, ALTER COLUMN created_at SET NOT NULL, ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE style_guide_faqs ALTER COLUMN display_order SET NOT NULL, ALTER COLUMN is_active SET NOT NULL, ALTER COLUMN created_at SET NOT NULL;
END
$audit$;
