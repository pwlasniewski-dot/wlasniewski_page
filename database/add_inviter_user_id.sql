ALTER TABLE photo_challenges ADD COLUMN IF NOT EXISTS inviter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
UPDATE photo_challenges pc SET inviter_user_id = u.id FROM users u WHERE pc.inviter_user_id IS NULL AND pc.inviter_email IS NOT NULL AND LOWER(u.email)=LOWER(pc.inviter_email);
UPDATE photo_challenges SET admin_notes = NULL WHERE admin_notes ~ '^Inviter User ID: [0-9]+$';
