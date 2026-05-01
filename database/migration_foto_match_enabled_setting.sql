-- ============================================================
-- FAZA 2: Foto-Match — globalny przełącznik dostępu
-- ============================================================
-- foto_match_enabled = false (default) → wizard /foto-match/onboarding zwraca 403,
--   CTA w /konto się nie pokazuje, /foto-match landing nadal działa (waitlist)
-- = true → klient z konta CRM może dołączyć do programu
-- ZERO LOSS: ALTER TABLE ADD COLUMN IF NOT EXISTS
-- ============================================================

ALTER TABLE settings ADD COLUMN IF NOT EXISTS foto_match_enabled BOOLEAN DEFAULT FALSE;

-- Sanity (powinno zwrócić 1 wiersz)
SELECT setting_key, foto_match_enabled FROM settings LIMIT 1;
