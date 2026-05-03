-- Add session_end_time to offers
ALTER TABLE offers ADD COLUMN session_end_time VARCHAR(8);
