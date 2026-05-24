-- Performance index for group-gallery parent email login
-- Safe to run multiple times on PostgreSQL

CREATE INDEX IF NOT EXISTS idx_gallery_participants_gallery_email
ON gallery_participants (gallery_id, parent_email);
