-- Migration dla Modułu Foto-Wyzwanie
-- Database: baza22505_4558816
-- Uruchom ten skrypt w phpMyAdmin

-- ============================================
-- 1. CHALLENGE_PACKAGES - Pakiety sesji
-- ============================================
CREATE TABLE IF NOT EXISTS `challenge_packages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `base_price` DECIMAL(10,2) NOT NULL,
  `challenge_price` DECIMAL(10,2) NOT NULL,
  `discount_percentage` INT NOT NULL,
  `included_items` JSON,
  `is_active` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. CHALLENGE_LOCATIONS - Lokalizacje w Toruniu
-- ============================================
CREATE TABLE IF NOT EXISTS `challenge_locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `address` VARCHAR(255),
  `google_maps_url` VARCHAR(500),
  `image_url` VARCHAR(500),
  `is_active` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. CHALLENGE_USERS - Użytkownicy akceptujący wyzwania
-- ============================================
CREATE TABLE IF NOT EXISTS `challenge_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255),
  `name` VARCHAR(255),
  `phone` VARCHAR(50),
  `auth_provider` ENUM('email', 'facebook', 'google') DEFAULT 'email',
  `auth_provider_id` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL,
  INDEX idx_email (`email`),
  INDEX idx_auth_provider (`auth_provider`, `auth_provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. PHOTO_CHALLENGES - Główna tabela wyzwań
-- ============================================
CREATE TABLE IF NOT EXISTS `photo_challenges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `unique_link` VARCHAR(100) UNIQUE NOT NULL,
  
  -- Dane zapraszającego
  `inviter_name` VARCHAR(255) NOT NULL,
  `inviter_contact` VARCHAR(255) NOT NULL,
  `inviter_contact_type` ENUM('email', 'phone', 'facebook', 'instagram', 'website') DEFAULT 'email',
  
  -- Dane zaproszonego
  `invitee_name` VARCHAR(255) NOT NULL,
  `invitee_contact` VARCHAR(255) NOT NULL,
  `invitee_contact_type` ENUM('email', 'phone', 'facebook', 'instagram', 'website') DEFAULT 'email',
  `invitee_user_id` INT NULL,
  
  -- Szczegóły wyzwania
  `package_id` INT NOT NULL,
  `location_id` INT NULL,
  `custom_location` VARCHAR(255),
  `custom_location_maps_url` VARCHAR(500),
  
  -- Rabaty
  `discount_amount` DECIMAL(10,2) NOT NULL,
  `discount_percentage` INT NOT NULL,
  
  -- Status i terminy
  `status` ENUM('sent', 'viewed', 'accepted', 'rejected', 'scheduled', 'completed', 'expired') DEFAULT 'sent',
  `acceptance_deadline` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `viewed_at` TIMESTAMP NULL,
  `accepted_at` TIMESTAMP NULL,
  `rejected_at` TIMESTAMP NULL,
  `session_date` TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  
  -- Preferowane terminy (zapisane jako JSON)
  `preferred_dates` JSON,
  
  -- Notatki admina
  `admin_notes` TEXT,
  
  -- Galeria
  `gallery_id` INT NULL,
  
  FOREIGN KEY (`package_id`) REFERENCES `challenge_packages`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`location_id`) REFERENCES `challenge_locations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`invitee_user_id`) REFERENCES `challenge_users`(`id`) ON DELETE SET NULL,
  
  INDEX idx_unique_link (`unique_link`),
  INDEX idx_status (`status`),
  INDEX idx_created (`created_at`),
  INDEX idx_session_date (`session_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. CHALLENGE_TIMELINE_EVENTS - Historia zdarzeń
-- ============================================
CREATE TABLE IF NOT EXISTS `challenge_timeline_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `challenge_id` INT NOT NULL,
  `event_type` VARCHAR(50) NOT NULL,
  `event_description` TEXT,
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`challenge_id`) REFERENCES `photo_challenges`(`id`) ON DELETE CASCADE,
  INDEX idx_challenge (`challenge_id`),
  INDEX idx_created (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. CHALLENGE_GALLERIES - Galerie par
-- ============================================
CREATE TABLE IF NOT EXISTS `challenge_galleries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `challenge_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `couple_names` VARCHAR(255),
  `session_type` VARCHAR(100),
  `testimonial_text` TEXT,
  `is_published` BOOLEAN DEFAULT FALSE,
  `show_in_public_gallery` BOOLEAN DEFAULT FALSE,
  `layout_style` ENUM('masonry', 'circles', 'overlay', 'carousel') DEFAULT 'masonry',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `published_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`challenge_id`) REFERENCES `photo_challenges`(`id`) ON DELETE CASCADE,
  INDEX idx_public (`show_in_public_gallery`, `is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dodaj klucz obcy do photo_challenges dla gallery_id
ALTER TABLE `photo_challenges`
ADD CONSTRAINT fk_challenge_gallery 
FOREIGN KEY (`gallery_id`) REFERENCES `challenge_galleries`(`id`) ON DELETE SET NULL;

-- ============================================
-- 7. CHALLENGE_PHOTOS - Zdjęcia w galeriach
-- ============================================
CREATE TABLE IF NOT EXISTS `challenge_photos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `gallery_id` INT NOT NULL,
  `media_id` INT NOT NULL,
  `is_cover` BOOLEAN DEFAULT FALSE,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`gallery_id`) REFERENCES `challenge_galleries`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`media_id`) REFERENCES `media_library`(`id`) ON DELETE CASCADE,
  INDEX idx_gallery (`gallery_id`),
  INDEX idx_cover (`is_cover`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. CHALLENGE_SETTINGS - Ustawienia modułu
-- ============================================
CREATE TABLE IF NOT EXISTS `challenge_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) UNIQUE NOT NULL,
  `setting_value` TEXT,
  `setting_type` ENUM('boolean', 'number', 'text', 'json') DEFAULT 'text',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DANE POCZĄTKOWE - Ustawienia
-- ============================================
INSERT INTO `challenge_settings` (`setting_key`, `setting_value`, `setting_type`) VALUES
-- Moduły ON/OFF
('module_enabled', 'true', 'boolean'),
('fomo_countdown_enabled', 'true', 'boolean'),
('social_proof_enabled', 'true', 'boolean'),
('monthly_limit_enabled', 'true', 'boolean'),
('public_gallery_enabled', 'true', 'boolean'),

-- Parametry FOMO
('fomo_countdown_hours', '24', 'number'),

-- Limity
('monthly_challenge_limit', '20', 'number'),

-- Treści
('landing_headline', 'Przyjmij foto-wyzwanie', 'text'),
('landing_subtitle', 'Zaproś kogoś na sesję i zgarnij mega rabat', 'text'),
('cta_button_text', 'Zacznij wyzwanie', 'text'),
('fomo_message', 'Zostało tylko {remaining} wyzwań z rabatem w tym miesiącu!', 'text'),
('social_proof_message', 'W tym miesiącu {count} par przyjęło wyzwanie', 'text'),

-- Wizualne
('gold_accent_intensity', '100', 'number'),
('enable_carousels', 'true', 'boolean'),
('enable_circular_grids', 'true', 'boolean'),
('enable_overlapping_images', 'true', 'boolean'),
('enable_parallax', 'true', 'boolean')

ON DUPLICATE KEY UPDATE setting_key=setting_key;

-- ============================================
-- DANE POCZĄTKOWE - Pakiety
-- ============================================
INSERT INTO `challenge_packages` 
(`name`, `description`, `base_price`, `challenge_price`, `discount_percentage`, `included_items`, `display_order`) 
VALUES
(
  'Mini',
  'Idealna na start',
  299.00,
  249.00,
  17,
  JSON_ARRAY(
    '20 edytowanych zdjęć',
    'Sesja do 1h',
    'Galeria online',
    'Konsultacja przed sesją'
  ),
  1
),
(
  'Standard',
  'Najpopularniejszy wybór',
  449.00,
  369.00,
  18,
  JSON_ARRAY(
    '40 edytowanych zdjęć',
    'Sesja do 2h',
    'Galeria online',
    'Konsultacja przed sesją',
    '2 lokalizacje',
    'Zdjęcia w高 rozdzielczości'
  ),
  2
),
(
  'Premium',
  'Pełen komfort',
  699.00,
  549.00,
  21,
  JSON_ARRAY(
    '60+ edytowanych zdjęć',
    'Sesja do 3h',
    'Galeria online',
    'Konsultacja przed sesją',
    '3 lokalizacje',
    'Zdjęcia w wysokiej rozdzielczości',
    'Wydruki 15x23cm (5 szt.)',
    'Dodatkowy outfit/scenografia'
  ),
  3
)
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- DANE POCZĄTKOWE - Lokalizacje
-- ============================================
INSERT INTO `challenge_locations` 
(`name`, `description`, `address`, `google_maps_url`, `display_order`) 
VALUES
(
  'Toruńska Starówka',
  'Klimatyczne uliczki, kamienice, średniowieczny urok',
  'Rynek Staromiejski, Toruń',
  'https://maps.app.goo.gl/torun-stare-miasto',
  1
),
(
  'Bulwar Filadelfijski',
  'Wisła, mosty, zachody słońca',
  'Bulwar Filadelfijski, Toruń',
  'https://maps.app.goo.gl/bulwar-torun',
  2
),
(
  'Ruiny Zamku Krzyżackiego',
  'Historyczne ruiny, romantyczny klimat',
  'Przedzamcze 3, Toruń',
  'https://maps.app.goo.gl/zamek-torun',
  3
),
(
  'Planetarium',
  'Nowoczesna architektura, futurystyczne kształty',
  'Franciszka Reja 6, Toruń',
  'https://maps.app.goo.gl/planetarium-torun',
  4
),
(
  'Park Miejski',
  'Zieleń, natura, spokój',
  'Park Miejski, Toruń',
  'https://maps.app.goo.gl/park-torun',
  5
)
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- WERYFIKACJA
-- ============================================
SELECT 'Migracja Photo Challenge zakończona!' AS status;

SELECT TABLE_NAME, TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'baza22505_4558816' 
AND TABLE_NAME LIKE 'challenge%'
ORDER BY TABLE_NAME;
