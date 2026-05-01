-- Foto-Match — weryfikacja telefonu (zastępuje skan dowodu, RODO data minimization)
-- Sprint 3.1 — phone OTP

ALTER TABLE "foto_match_profile" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20);
ALTER TABLE "foto_match_profile" ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMP(3);
ALTER TABLE "foto_match_profile" ADD COLUMN IF NOT EXISTS "phone_verification_code_hash" VARCHAR(120);
ALTER TABLE "foto_match_profile" ADD COLUMN IF NOT EXISTS "phone_verification_expires_at" TIMESTAMP(3);
ALTER TABLE "foto_match_profile" ADD COLUMN IF NOT EXISTS "phone_verification_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "foto_match_profile" ADD COLUMN IF NOT EXISTS "age_declared_at" TIMESTAMP(3);
ALTER TABLE "foto_match_profile" ADD COLUMN IF NOT EXISTS "age_declared_ip" VARCHAR(64);

CREATE INDEX IF NOT EXISTS "idx_foto_match_profile_phone_verified_at" ON "foto_match_profile" ("phone_verified_at");
