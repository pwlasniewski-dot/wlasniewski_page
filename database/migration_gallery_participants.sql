-- Migration: Add GalleryParticipant and PhotoSelection tables for group galleries
-- Date: 2026-05-18
-- Purpose: Enable group photo selection (e.g., 60 kids in communion, each parent selects max 5 photos for print)

-- Table for gallery participants (e.g., children in communion)
CREATE TABLE gallery_participants (
    id SERIAL PRIMARY KEY,
    gallery_id INTEGER NOT NULL REFERENCES client_galleries(id) ON DELETE CASCADE,
    participant_code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    max_selections INTEGER DEFAULT 5,
    publication_consent BOOLEAN DEFAULT FALSE,
    consent_given_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE gallery_participants IS 'Uczestnicy galerii grupowej (np. dzieci w komunii)';
COMMENT ON COLUMN gallery_participants.participant_code IS 'Unikalny kod dostępu dla rodzica';
COMMENT ON COLUMN gallery_participants.name IS 'Nazwa uczestnika (np. "Jan Kowalski", "Dziecko 1")';
COMMENT ON COLUMN gallery_participants.max_selections IS 'Limit zdjęć do wyboru (domyślnie 5)';
COMMENT ON COLUMN gallery_participants.publication_consent IS 'Zgoda na publikację zdjęć na stronie fotografa';

-- Table for photo selections by participants
CREATE TABLE photo_selections (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER NOT NULL REFERENCES gallery_participants(id) ON DELETE CASCADE,
    photo_id INTEGER NOT NULL REFERENCES gallery_photos(id) ON DELETE CASCADE,
    selected_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(participant_id, photo_id)
);

COMMENT ON TABLE photo_selections IS 'Wybrane zdjęcia przez uczestników do wydruku';

-- Indexes for performance
CREATE INDEX idx_gallery_participants_gallery_id ON gallery_participants(gallery_id);
CREATE INDEX idx_gallery_participants_code ON gallery_participants(participant_code);
CREATE INDEX idx_photo_selections_participant_id ON photo_selections(participant_id);
CREATE INDEX idx_photo_selections_photo_id ON photo_selections(photo_id);
