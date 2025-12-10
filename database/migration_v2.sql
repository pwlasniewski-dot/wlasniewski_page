-- Migration V2: Add Hero Slides and Static Pages

-- 1. Hero Slides Table
CREATE TABLE IF NOT EXISTS `hero_slides` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255),
  `subtitle` VARCHAR(255),
  `button_text` VARCHAR(255),
  `button_link` VARCHAR(255),
  `image_id` INT NOT NULL,
  `display_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`image_id`) REFERENCES `media_library`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Static Pages Table
CREATE TABLE IF NOT EXISTS `pages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `meta_title` VARCHAR(255),
  `meta_description` VARCHAR(255),
  `is_published` BOOLEAN DEFAULT FALSE,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Insert Default Pages
INSERT INTO `pages` (`slug`, `title`, `content`, `is_published`) VALUES
('about', 'O mnie', '<h2>O mnie</h2><p>Tutaj wpisz treść strony o mnie...</p>', TRUE),
('offer', 'Oferta', '<h2>Moja Oferta</h2><p>Tutaj wpisz treść oferty...</p>', TRUE),
('contact', 'Kontakt', '<h2>Kontakt</h2><p>Skontaktuj się ze mną...</p>', TRUE);
