-- Migration: Add avatar field for GROUP mode participants
-- Date: 2026-05-18
-- Description: Each parent in GROUP mode can choose a unique emoji avatar
--              for easier visual identification (no personal data needed)

ALTER TABLE gallery_participants
ADD COLUMN avatar VARCHAR(10);

COMMENT ON COLUMN gallery_participants.avatar IS 'Emoji avatar chosen by parent in GROUP mode (unique within gallery)';

-- Ensure avatar uniqueness within each gallery (when set)
CREATE UNIQUE INDEX idx_gallery_avatar 
ON gallery_participants(gallery_id, avatar)
WHERE avatar IS NOT NULL;

COMMENT ON INDEX idx_gallery_avatar IS 'Ensures avatar uniqueness within each gallery in GROUP mode';
