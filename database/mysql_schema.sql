-- =====================================================
-- WLASNIEWSKI.PL - MySQL Schema
-- Wygenerowane dla CyberFolks
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Admin Users
CREATE TABLE IF NOT EXISTS `admin_users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255),
    `role` VARCHAR(50) DEFAULT 'ADMIN',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `last_login` DATETIME,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Settings
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `setting_key` VARCHAR(255) NOT NULL UNIQUE,
    `setting_value` TEXT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `parallax_home_1` VARCHAR(500) DEFAULT '',
    `parallax_home_2` VARCHAR(500) DEFAULT '',
    `about_me_hero_image` VARCHAR(500) DEFAULT '',
    `about_me_portrait` VARCHAR(500) DEFAULT '',
    `info_band_image` VARCHAR(500) DEFAULT '',
    `info_band_title` VARCHAR(255),
    `info_band_content` TEXT,
    `exit_popup_enabled` BOOLEAN DEFAULT FALSE,
    `exit_popup_title` VARCHAR(255),
    `exit_popup_content` TEXT,
    `exit_popup_cta_text` VARCHAR(255),
    `exit_popup_cta_link` VARCHAR(500),
    `navbar_layout` VARCHAR(50) DEFAULT 'logo_left_menu_right',
    `navbar_sticky` BOOLEAN DEFAULT TRUE,
    `favicon_url` VARCHAR(500),
    `smtp_host` VARCHAR(255),
    `smtp_port` INT,
    `smtp_user` VARCHAR(255),
    `smtp_password` VARCHAR(255),
    `smtp_from` VARCHAR(255),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Pages
CREATE TABLE IF NOT EXISTS `pages` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `meta_title` VARCHAR(255),
    `meta_description` TEXT,
    `is_published` BOOLEAN DEFAULT FALSE,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `hero_image` VARCHAR(500),
    `hero_subtitle` VARCHAR(500),
    `content_images` LONGTEXT,
    `parallax_sections` LONGTEXT,
    `content_cards` LONGTEXT,
    `about_photo` VARCHAR(500),
    `about_text_side` TEXT,
    `home_sections` LONGTEXT,
    `meta_keywords` TEXT,
    `page_type` VARCHAR(50) DEFAULT 'regular',
    `sections` LONGTEXT,
    `is_in_menu` BOOLEAN DEFAULT FALSE,
    `menu_title` VARCHAR(255),
    `menu_order` INT DEFAULT 0,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Menu Items
CREATE TABLE IF NOT EXISTS `menu_items` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500),
    `page_id` INT,
    `parent_id` INT,
    `order` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`parent_id`) REFERENCES `menu_items`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Media Library
CREATE TABLE IF NOT EXISTS `media_library` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `width` INT,
    `height` INT,
    `folder` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100),
    `tags` TEXT,
    `alt_text` VARCHAR(500),
    `webp_path` VARCHAR(500),
    `avif_path` VARCHAR(500),
    `thumbnail_path` VARCHAR(500),
    `used_in` TEXT,
    `is_featured` BOOLEAN DEFAULT FALSE,
    `uploaded_by` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`uploaded_by`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Portfolio Sessions
CREATE TABLE IF NOT EXISTS `portfolio_sessions` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `location` VARCHAR(255),
    `session_date` DATE,
    `cover_image_id` INT,
    `media_ids` TEXT,
    `meta_title` VARCHAR(255),
    `meta_description` TEXT,
    `is_published` BOOLEAN DEFAULT FALSE,
    `display_order` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`cover_image_id`) REFERENCES `media_library`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Blog Posts
CREATE TABLE IF NOT EXISTS `blog_posts` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `excerpt` TEXT,
    `content` LONGTEXT NOT NULL,
    `featured_image_id` INT,
    `meta_title` VARCHAR(255),
    `meta_description` TEXT,
    `keywords` TEXT,
    `category` VARCHAR(100),
    `tags` TEXT,
    `status` VARCHAR(50) DEFAULT 'draft',
    `published_at` DATETIME,
    `author_id` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`featured_image_id`) REFERENCES `media_library`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`author_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Testimonials
CREATE TABLE IF NOT EXISTS `testimonials` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `client_name` VARCHAR(255) NOT NULL,
    `client_photo_id` INT,
    `testimonial_text` TEXT NOT NULL,
    `rating` INT,
    `source` VARCHAR(100),
    `photo_size` INT DEFAULT 80,
    `is_featured` BOOLEAN DEFAULT FALSE,
    `show_on_booking_page` BOOLEAN DEFAULT FALSE,
    `display_order` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`client_photo_id`) REFERENCES `media_library`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Promo Codes
CREATE TABLE IF NOT EXISTS `promo_codes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `discount_value` INT NOT NULL,
    `discount_type` VARCHAR(20) NOT NULL,
    `valid_from` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `valid_until` DATETIME,
    `is_active` BOOLEAN DEFAULT TRUE,
    `max_usage` INT,
    `usage_count` INT DEFAULT 0,
    `auto_generated_for_email` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Inquiries
CREATE TABLE IF NOT EXISTS `inquiries` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50),
    `message` TEXT NOT NULL,
    `session_type` VARCHAR(100),
    `preferred_date` DATE,
    `promo_code` VARCHAR(50),
    `source` VARCHAR(100),
    `status` VARCHAR(50) DEFAULT 'new',
    `notes` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Email Subscribers
CREATE TABLE IF NOT EXISTS `email_subscribers` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `source` VARCHAR(100) NOT NULL,
    `promo_code_sent` VARCHAR(50),
    `is_active` BOOLEAN DEFAULT TRUE,
    `subscribed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Analytics Events
CREATE TABLE IF NOT EXISTS `analytics_events` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `event_type` VARCHAR(100) NOT NULL,
    `page_url` VARCHAR(500),
    `user_id` VARCHAR(255) NOT NULL,
    `session_id` VARCHAR(255) NOT NULL,
    `referrer` VARCHAR(500),
    `utm_source` VARCHAR(100),
    `utm_medium` VARCHAR(100),
    `utm_campaign` VARCHAR(100),
    `metadata` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_event_type` (`event_type`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Hero Slides
CREATE TABLE IF NOT EXISTS `hero_slides` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255),
    `subtitle` VARCHAR(500),
    `button_text` VARCHAR(100),
    `button_link` VARCHAR(500),
    `image_id` INT NOT NULL,
    `display_order` INT DEFAULT 0,
    `display_mode` VARCHAR(20) DEFAULT 'BOTH',
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`image_id`) REFERENCES `media_library`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Bookings
CREATE TABLE IF NOT EXISTS `bookings` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `service` VARCHAR(100) NOT NULL,
    `package` VARCHAR(100) NOT NULL,
    `price` INT NOT NULL,
    `date` DATE NOT NULL,
    `start_time` VARCHAR(10),
    `end_time` VARCHAR(10),
    `client_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50),
    `venue_city` VARCHAR(255),
    `venue_place` VARCHAR(255),
    `notes` TEXT,
    `promo_code` VARCHAR(50),
    `gift_card_code` VARCHAR(50),
    `challenge_id` INT,
    `status` VARCHAR(50) DEFAULT 'pending',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Gift Cards
CREATE TABLE IF NOT EXISTS `gift_cards` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `amount` INT NOT NULL,
    `recipient_email` VARCHAR(255) NOT NULL,
    `recipient_name` VARCHAR(255) NOT NULL,
    `message` TEXT,
    `is_used` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `used_at` DATETIME,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Session Invites
CREATE TABLE IF NOT EXISTS `session_invites` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `inviter_name` VARCHAR(255) NOT NULL,
    `partner_name` VARCHAR(255) NOT NULL,
    `occasion` VARCHAR(100),
    `message` TEXT,
    `style` VARCHAR(50) DEFAULT 'romantic',
    `is_viewed` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Challenge Packages
CREATE TABLE IF NOT EXISTS `challenge_packages` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `base_price` INT NOT NULL,
    `challenge_price` INT NOT NULL,
    `discount_percentage` INT NOT NULL,
    `included_items` TEXT,
    `is_active` BOOLEAN DEFAULT TRUE,
    `display_order` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Challenge Locations
CREATE TABLE IF NOT EXISTS `challenge_locations` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `address` VARCHAR(500),
    `google_maps_url` VARCHAR(500),
    `image_url` VARCHAR(500),
    `is_active` BOOLEAN DEFAULT TRUE,
    `display_order` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Challenge Users
CREATE TABLE IF NOT EXISTS `challenge_users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255),
    `name` VARCHAR(255),
    `phone` VARCHAR(50),
    `auth_provider` VARCHAR(50) DEFAULT 'email',
    `auth_provider_id` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `last_login` DATETIME,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Photo Challenges
CREATE TABLE IF NOT EXISTS `photo_challenges` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `unique_link` VARCHAR(255) NOT NULL UNIQUE,
    `inviter_name` VARCHAR(255) NOT NULL,
    `inviter_contact` VARCHAR(255) NOT NULL,
    `inviter_contact_type` VARCHAR(50) DEFAULT 'email',
    `invitee_name` VARCHAR(255) NOT NULL,
    `invitee_contact` VARCHAR(255) NOT NULL,
    `invitee_contact_type` VARCHAR(50) DEFAULT 'email',
    `invitee_user_id` INT,
    `package_id` INT NOT NULL,
    `location_id` INT,
    `custom_location` VARCHAR(500),
    `custom_location_maps_url` VARCHAR(500),
    `discount_amount` INT NOT NULL,
    `discount_percentage` INT NOT NULL,
    `status` VARCHAR(50) DEFAULT 'sent',
    `acceptance_deadline` DATETIME,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `viewed_at` DATETIME,
    `accepted_at` DATETIME,
    `rejected_at` DATETIME,
    `session_date` DATE,
    `completed_at` DATETIME,
    `preferred_dates` TEXT,
    `admin_notes` TEXT,
    `channel` VARCHAR(50) DEFAULT 'messenger',
    PRIMARY KEY (`id`),
    INDEX `idx_unique_link` (`unique_link`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`package_id`) REFERENCES `challenge_packages`(`id`),
    FOREIGN KEY (`location_id`) REFERENCES `challenge_locations`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`invitee_user_id`) REFERENCES `challenge_users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Challenge Timeline Events
CREATE TABLE IF NOT EXISTS `challenge_timeline_events` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `challenge_id` INT NOT NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `event_description` TEXT,
    `metadata` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_challenge_id` (`challenge_id`),
    FOREIGN KEY (`challenge_id`) REFERENCES `photo_challenges`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Challenge Settings
CREATE TABLE IF NOT EXISTS `challenge_settings` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `setting_key` VARCHAR(255) NOT NULL UNIQUE,
    `setting_value` TEXT,
    `setting_type` VARCHAR(50) DEFAULT 'text',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Challenge Galleries
CREATE TABLE IF NOT EXISTS `challenge_galleries` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `challenge_id` INT UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `couple_names` VARCHAR(255),
    `session_type` VARCHAR(100),
    `testimonial_text` TEXT,
    `layout_style` VARCHAR(50) DEFAULT 'grid',
    `is_published` BOOLEAN DEFAULT FALSE,
    `show_in_public_gallery` BOOLEAN DEFAULT TRUE,
    `published_at` DATETIME,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`challenge_id`) REFERENCES `photo_challenges`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Challenge Photos
CREATE TABLE IF NOT EXISTS `challenge_photos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `gallery_id` INT NOT NULL,
    `media_id` INT NOT NULL,
    `is_cover` BOOLEAN DEFAULT FALSE,
    `display_order` INT DEFAULT 0,
    `caption` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`gallery_id`) REFERENCES `challenge_galleries`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`media_id`) REFERENCES `media_library`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Client Galleries
CREATE TABLE IF NOT EXISTS `client_galleries` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `booking_id` INT UNIQUE,
    `client_email` VARCHAR(255) NOT NULL,
    `client_name` VARCHAR(255) NOT NULL,
    `access_code` VARCHAR(100) NOT NULL UNIQUE,
    `expires_at` DATETIME,
    `standard_count` INT DEFAULT 0,
    `price_per_premium` INT DEFAULT 2000,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Gallery Photos
CREATE TABLE IF NOT EXISTS `gallery_photos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `gallery_id` INT NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `thumbnail_url` VARCHAR(500),
    `file_size` INT NOT NULL,
    `width` INT,
    `height` INT,
    `is_standard` BOOLEAN DEFAULT FALSE,
    `order_index` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`gallery_id`) REFERENCES `client_galleries`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. Photo Orders
CREATE TABLE IF NOT EXISTS `photo_orders` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `gallery_id` INT NOT NULL,
    `photo_ids` TEXT NOT NULL,
    `photo_count` INT NOT NULL,
    `total_amount` INT NOT NULL,
    `payment_status` VARCHAR(50) DEFAULT 'pending',
    `payment_id` VARCHAR(255),
    `payment_url` VARCHAR(500),
    `paid_at` DATETIME,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`gallery_id`) REFERENCES `client_galleries`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. System Settings
CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(255) NOT NULL UNIQUE,
    `value` TEXT NOT NULL,
    `description` TEXT,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. Page Effects
CREATE TABLE IF NOT EXISTS `page_effects` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `page_slug` VARCHAR(100) NOT NULL,
    `section_name` VARCHAR(100) NOT NULL,
    `effect_type` VARCHAR(50) NOT NULL,
    `is_enabled` BOOLEAN DEFAULT FALSE,
    `config` TEXT,
    `photos_source` VARCHAR(50) DEFAULT 'portfolio',
    `manual_photos` TEXT,
    `order_index` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_page_section` (`page_slug`, `section_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Default Admin User (password: admin123 - CHANGE IT!)
INSERT INTO `admin_users` (`email`, `password_hash`, `name`, `role`) VALUES
('przemyslaw@wlasniewski.pl', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Przemysław Właśniewski', 'ADMIN');

-- Default Settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('site_name', 'Przemysław Właśniewski - Fotograf'),
('site_description', 'Naturalne zdjęcia rodzinne, ślubne, portretowe i komunijne'),
('contact_email', 'przemyslaw@wlasniewski.pl'),
('contact_phone', '+48 530 788 694');

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- DONE! Import complete.
-- =====================================================
