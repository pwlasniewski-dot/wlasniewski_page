ALTER TABLE "email_subscribers"
    ADD COLUMN "consent_version" TEXT NOT NULL DEFAULT 'legacy-unknown',
    ADD COLUMN "consent_ip" VARCHAR(64),
    ADD COLUMN "consent_user_agent" VARCHAR(255),
    ADD COLUMN "unsubscribe_token" VARCHAR(64),
    ADD COLUMN "unsubscribed_at" TIMESTAMP(3),
    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "email_subscribers"
SET "unsubscribe_token" = md5(
    random()::text || clock_timestamp()::text || "id"::text
)
WHERE "unsubscribe_token" IS NULL;

ALTER TABLE "email_subscribers"
    ALTER COLUMN "unsubscribe_token" SET NOT NULL;

CREATE UNIQUE INDEX "email_subscribers_unsubscribe_token_key"
    ON "email_subscribers"("unsubscribe_token");
