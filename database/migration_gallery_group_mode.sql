-- Migration: Add GROUP mode support for galleries
-- Date: 2026-05-18
-- Description: Adds support for group galleries where multiple parents share one access code
--              and create unique profiles with initials (e.g., JK-4729)

-- Add GROUP mode fields to ClientGallery
ALTER TABLE client_galleries
ADD COLUMN gallery_mode VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN group_access_code VARCHAR(50) UNIQUE,
ADD COLUMN group_password VARCHAR(255),
ADD COLUMN max_photos_for_print INT;

COMMENT ON COLUMN client_galleries.gallery_mode IS 'Gallery type: INDIVIDUAL (unique codes per participant) or GROUP (shared access code)';
COMMENT ON COLUMN client_galleries.group_access_code IS 'Shared access code for GROUP mode (e.g., KOMUNIA2026)';
COMMENT ON COLUMN client_galleries.group_password IS 'Optional password for GROUP mode access';
COMMENT ON COLUMN client_galleries.max_photos_for_print IS 'Maximum number of photos each participant can select for print';

-- Add GROUP mode fields to GalleryParticipant
ALTER TABLE gallery_participants
ADD COLUMN parent_identifier VARCHAR(20),
ADD COLUMN consent_scope VARCHAR(20);

COMMENT ON COLUMN gallery_participants.parent_identifier IS 'Unique identifier for parent in GROUP mode: initials + 4 digits (e.g., JK-4729)';
COMMENT ON COLUMN gallery_participants.consent_scope IS 'Publication consent scope: ALL (all photos) or SELECTED (only chosen photos)';

-- Make participant_code nullable (not required for GROUP mode)
ALTER TABLE gallery_participants
ALTER COLUMN participant_code DROP NOT NULL;

-- Add unique constraint for GROUP mode participants
CREATE UNIQUE INDEX idx_gallery_parent_identifier 
ON gallery_participants(gallery_id, parent_identifier)
WHERE parent_identifier IS NOT NULL;

COMMENT ON INDEX idx_gallery_parent_identifier IS 'Ensures parent_identifier uniqueness within each gallery in GROUP mode';
