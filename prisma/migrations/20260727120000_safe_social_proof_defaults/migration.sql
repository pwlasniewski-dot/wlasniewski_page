-- New installations should not publish marketing statistics until an administrator
-- explicitly supplies verified values. Existing configured values are preserved.
ALTER TABLE "settings"
ALTER COLUMN "social_proof_enabled" SET DEFAULT false,
ALTER COLUMN "social_proof_total_clients" SET DEFAULT 0;
