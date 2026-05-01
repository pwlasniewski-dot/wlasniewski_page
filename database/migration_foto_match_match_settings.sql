-- ============================================================
-- FAZA 2/3: Foto-Match — globalne reguły dopasowywania (matching).
-- Singleton (jeden wiersz); admin steruje 15 cechami + parametrami.
-- WSZYSTKIE wyłączone → discovery zwraca pełną pulę ACTIVE.
-- ============================================================

CREATE TABLE IF NOT EXISTS foto_match_match_settings (
  id                              SERIAL PRIMARY KEY,

  -- 1. Płeć
  opposite_gender_only            BOOLEAN NOT NULL DEFAULT FALSE,
  same_gender_only                BOOLEAN NOT NULL DEFAULT FALSE,

  -- 2. Geografia
  same_city                       BOOLEAN NOT NULL DEFAULT FALSE,
  respect_search_radius           BOOLEAN NOT NULL DEFAULT FALSE,

  -- 3. Wiek
  age_range                       BOOLEAN NOT NULL DEFAULT FALSE,
  age_range_years                 INT     NOT NULL DEFAULT 5,

  -- 4. Zainteresowania
  min_shared_interests            BOOLEAN NOT NULL DEFAULT FALSE,
  min_shared_interests_count      INT     NOT NULL DEFAULT 2,

  -- 5. Doświadczenie / komfort
  same_experience_level           BOOLEAN NOT NULL DEFAULT FALSE,
  complementary_experience        BOOLEAN NOT NULL DEFAULT FALSE,
  same_comfort_level              BOOLEAN NOT NULL DEFAULT FALSE,

  -- 6. Jakość profilu
  verified_only                   BOOLEAN NOT NULL DEFAULT FALSE,
  min_photos                      BOOLEAN NOT NULL DEFAULT FALSE,
  min_photos_count                INT     NOT NULL DEFAULT 3,
  no_flagged_photos               BOOLEAN NOT NULL DEFAULT FALSE,

  -- 7. Aktywność
  recently_active                 BOOLEAN NOT NULL DEFAULT FALSE,
  recently_active_days            INT     NOT NULL DEFAULT 30,

  -- 8. Historia interakcji (Faza 4)
  exclude_already_seen            BOOLEAN NOT NULL DEFAULT FALSE,
  exclude_already_matched         BOOLEAN NOT NULL DEFAULT FALSE,

  -- 9. Bonus referralowy — polec parę dostaniesz rabat
  referral_bonus_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  referral_bonus_amount_grosze    INT     NOT NULL DEFAULT 5000,   -- 50 zł
  referral_bonus_percent          INT     NOT NULL DEFAULT 10,     -- 10 %
  referral_bonus_type             VARCHAR(20) NOT NULL DEFAULT 'AMOUNT', -- AMOUNT | PERCENT | BOTH
  referral_bonus_min_to_redeem    INT     NOT NULL DEFAULT 1,      -- ilu poleconych musi się zarejestrować i ACTIVE
  referral_bonus_expires_days     INT     NOT NULL DEFAULT 90,

  updated_at                      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by                      INT
);

-- Singleton — wstaw wiersz tylko jeśli nie istnieje.
INSERT INTO foto_match_match_settings (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM foto_match_match_settings WHERE id = 1);

-- ============================================================
-- Tabela poleceń (referral): kto polecił kogo, status, nagroda.
-- ============================================================
CREATE TABLE IF NOT EXISTS foto_match_referral (
  id                    SERIAL PRIMARY KEY,
  referrer_profile_id   INT NOT NULL REFERENCES foto_match_profile(id) ON DELETE CASCADE,
  invited_email         VARCHAR(255),       -- jeśli polecony zaproszony przez email
  invited_user_id       INT REFERENCES users(id) ON DELETE SET NULL,
  invited_profile_id    INT REFERENCES foto_match_profile(id) ON DELETE SET NULL,

  -- Stan
  status                VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  -- PENDING (wysłano zaproszenie) | REGISTERED (zarejestrował się) |
  -- ACTIVE (profil zatwierdzony, nagroda należna) | REWARDED (voucher wydany) |
  -- EXPIRED | CANCELED

  -- Nagroda — snapshot z ustawień w momencie wydania
  reward_amount_grosze  INT,
  reward_percent        INT,
  reward_type           VARCHAR(20),
  reward_voucher_code   VARCHAR(40) UNIQUE,
  reward_expires_at     TIMESTAMP,
  reward_redeemed_at    TIMESTAMP,
  reward_redeemed_for   VARCHAR(40),  -- np. CART:123 / BOOKING:456

  invite_token          VARCHAR(64) UNIQUE,
  share_count           INT NOT NULL DEFAULT 0,
  click_count           INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS foto_match_referral_referrer_idx ON foto_match_referral(referrer_profile_id);
CREATE INDEX IF NOT EXISTS foto_match_referral_status_idx ON foto_match_referral(status);
CREATE INDEX IF NOT EXISTS foto_match_referral_invited_email_idx ON foto_match_referral(invited_email);
CREATE INDEX IF NOT EXISTS foto_match_referral_invite_token_idx ON foto_match_referral(invite_token);

-- Sanity
SELECT id, opposite_gender_only, age_range, age_range_years, referral_bonus_enabled FROM foto_match_match_settings WHERE id=1;
