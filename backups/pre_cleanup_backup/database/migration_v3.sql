-- Migration V3: Full Site Content Management
-- Adds fields for parallax backgrounds, about me images, info band content, and page hero/content images

-- ============================================
-- 1. Extend Settings Table
-- ============================================

ALTER TABLE settings 
ADD COLUMN parallax_home_1 VARCHAR(255) DEFAULT '',
ADD COLUMN parallax_home_2 VARCHAR(255) DEFAULT '',
ADD COLUMN about_me_hero_image VARCHAR(255) DEFAULT '',
ADD COLUMN about_me_portrait VARCHAR(255) DEFAULT '',
ADD COLUMN info_band_image VARCHAR(255) DEFAULT '',
ADD COLUMN info_band_title VARCHAR(255) DEFAULT NULL,
ADD COLUMN info_band_content TEXT DEFAULT NULL;

-- ============================================
-- 2. Extend Pages Table
-- ============================================

ALTER TABLE pages
ADD COLUMN hero_image VARCHAR(255) DEFAULT NULL,
ADD COLUMN hero_subtitle VARCHAR(255) DEFAULT NULL,
ADD COLUMN content_images TEXT DEFAULT NULL,
ADD COLUMN meta_keywords VARCHAR(255) DEFAULT NULL;

-- ============================================
-- 3. Insert Default Pages (if not exist)
-- ============================================

INSERT INTO pages (slug, title, content, is_published, updated_at) 
VALUES 
  ('o-mnie', 'O mnie', '<p>Edytuj tę treść w panelu admina.</p>', 1, NOW()),
  ('jak-sie-ubrac', 'Jak się ubrać', '<p>Edytuj tę treść w panelu admina.</p>', 1, NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Done!
