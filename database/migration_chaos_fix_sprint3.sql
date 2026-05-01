-- Sprint 3 chaos fix: refund/consent/report/block/message/gdpr
-- ZERO LOSS: wszystkie operacje IF NOT EXISTS / ALTER ADD COLUMN IF NOT EXISTS

-- USERS: zgody RODO + soft-delete
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_ip VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_user_agent VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP;

-- BOOKINGS: refund + cancellation
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount INT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_id VARCHAR(80);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20);

-- SETTINGS: polityka cancellation
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cancellation_full_refund_days INT NOT NULL DEFAULT 7;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cancellation_partial_days INT NOT NULL DEFAULT 3;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS cancellation_partial_pct INT NOT NULL DEFAULT 50;

-- FOTO_MATCH_PROFILE: dodatkowe indeksy
CREATE INDEX IF NOT EXISTS foto_match_profile_last_active_idx ON foto_match_profile(last_active);
CREATE INDEX IF NOT EXISTS foto_match_profile_status_active_city_idx ON foto_match_profile(status, is_active, city);

-- FOTO_MATCH_BLOCK
CREATE TABLE IF NOT EXISTS foto_match_block (
  id          SERIAL PRIMARY KEY,
  blocker_id  INT NOT NULL REFERENCES foto_match_profile(id) ON DELETE CASCADE,
  blocked_id  INT NOT NULL REFERENCES foto_match_profile(id) ON DELETE CASCADE,
  reason      VARCHAR(255),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS foto_match_block_unique_idx ON foto_match_block(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS foto_match_block_blocker_idx ON foto_match_block(blocker_id);
CREATE INDEX IF NOT EXISTS foto_match_block_blocked_idx ON foto_match_block(blocked_id);

-- FOTO_MATCH_REPORT
CREATE TABLE IF NOT EXISTS foto_match_report (
  id           SERIAL PRIMARY KEY,
  reporter_id  INT NOT NULL REFERENCES foto_match_profile(id) ON DELETE CASCADE,
  reported_id  INT NOT NULL REFERENCES foto_match_profile(id) ON DELETE CASCADE,
  category     VARCHAR(40) NOT NULL,
  description  TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  admin_note   TEXT,
  resolved_by  INT,
  resolved_at  TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS foto_match_report_status_idx ON foto_match_report(status);
CREATE INDEX IF NOT EXISTS foto_match_report_reported_idx ON foto_match_report(reported_id);
CREATE INDEX IF NOT EXISTS foto_match_report_reporter_idx ON foto_match_report(reporter_id);

-- FOTO_MATCH_MESSAGE
CREATE TABLE IF NOT EXISTS foto_match_message (
  id              SERIAL PRIMARY KEY,
  from_profile_id INT NOT NULL REFERENCES foto_match_profile(id) ON DELETE CASCADE,
  to_profile_id   INT NOT NULL REFERENCES foto_match_profile(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  read_at         TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS foto_match_message_pair_idx ON foto_match_message(from_profile_id, to_profile_id);
CREATE INDEX IF NOT EXISTS foto_match_message_inbox_idx ON foto_match_message(to_profile_id, read_at);

-- FOTO_MATCH_SESSION_CONSENT (model release)
CREATE TABLE IF NOT EXISTS foto_match_session_consent (
  id                SERIAL PRIMARY KEY,
  profile_id        INT NOT NULL,
  match_partner_id  INT NOT NULL,
  booking_id        INT,
  consent_publish   BOOLEAN NOT NULL DEFAULT FALSE,
  consent_portfolio BOOLEAN NOT NULL DEFAULT FALSE,
  consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  signed_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  signed_ip         VARCHAR(64),
  withdrawn_at      TIMESTAMP,
  withdrawn_reason  TEXT
);
CREATE INDEX IF NOT EXISTS foto_match_session_consent_profile_idx ON foto_match_session_consent(profile_id);
CREATE INDEX IF NOT EXISTS foto_match_session_consent_partner_idx ON foto_match_session_consent(match_partner_id);
CREATE INDEX IF NOT EXISTS foto_match_session_consent_booking_idx ON foto_match_session_consent(booking_id);

-- BOOKING_COMPLAINT
CREATE TABLE IF NOT EXISTS booking_complaint (
  id              SERIAL PRIMARY KEY,
  booking_id      INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_email    VARCHAR(255) NOT NULL,
  category        VARCHAR(40) NOT NULL,
  body            TEXT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  admin_response  TEXT,
  responded_at    TIMESTAMP,
  responded_by    INT,
  refund_offered  INT,
  refund_accepted BOOLEAN,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS booking_complaint_booking_idx ON booking_complaint(booking_id);
CREATE INDEX IF NOT EXISTS booking_complaint_status_idx ON booking_complaint(status);
CREATE INDEX IF NOT EXISTS booking_complaint_email_idx ON booking_complaint(client_email);
