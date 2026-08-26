ALTER TABLE "gallery_participants"
  ADD COLUMN "selection_status" TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "selection_submitted_at" TIMESTAMP(3),
  ADD COLUMN "selection_version" INTEGER NOT NULL DEFAULT 0;

-- Preserve legacy work without pretending that an old toggle was an explicit
-- immutable submission. Complete max/max selections wait for a short admin
-- review; incomplete and empty selections remain DRAFT so parents can finish.
WITH "selection_totals" AS (
  SELECT "participant_id", COUNT(*)::INTEGER AS "selected_count"
  FROM "photo_selections"
  GROUP BY "participant_id"
)
UPDATE "gallery_participants" AS gp
SET "selection_status" = 'LEGACY_REVIEW_REQUIRED'
FROM "selection_totals" AS totals
WHERE totals."participant_id" = gp."id"
  AND totals."selected_count" = gp."max_selections"
  AND totals."selected_count" > 0;

CREATE INDEX "gallery_participants_gallery_id_selection_status_idx"
  ON "gallery_participants"("gallery_id", "selection_status");

CREATE UNIQUE INDEX "gallery_participants_gallery_id_parent_email_ci_key"
  ON "gallery_participants"("gallery_id", lower(btrim("parent_email")))
  WHERE "parent_email" IS NOT NULL AND btrim("parent_email") <> '';

CREATE TABLE "group_gallery_activities" (
  "id" SERIAL NOT NULL,
  "gallery_id" INTEGER NOT NULL,
  "participant_id" INTEGER,
  "photo_id" INTEGER,
  "action" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "correlation_id" UUID,
  "details" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_gallery_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "group_gallery_activities_gallery_id_created_at_idx"
  ON "group_gallery_activities"("gallery_id", "created_at");
CREATE INDEX "group_gallery_activities_participant_id_created_at_idx"
  ON "group_gallery_activities"("participant_id", "created_at");
CREATE INDEX "group_gallery_activities_action_result_created_at_idx"
  ON "group_gallery_activities"("action", "result", "created_at");

CREATE TABLE "group_gallery_login_tokens" (
  "id" UUID NOT NULL,
  "token_hash" CHAR(64) NOT NULL,
  "gallery_id" INTEGER NOT NULL,
  "participant_id" INTEGER NOT NULL,
  "email" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_gallery_login_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "group_gallery_login_tokens_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "client_galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "group_gallery_login_tokens_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "gallery_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "group_gallery_login_tokens_token_hash_key"
  ON "group_gallery_login_tokens"("token_hash");
CREATE INDEX "group_gallery_login_tokens_participant_id_expires_at_idx"
  ON "group_gallery_login_tokens"("participant_id", "expires_at");
CREATE INDEX "group_gallery_login_tokens_gallery_id_email_created_at_idx"
  ON "group_gallery_login_tokens"("gallery_id", "email", "created_at");

CREATE TABLE "group_selection_submissions" (
  "id" UUID NOT NULL,
  "gallery_id" INTEGER NOT NULL,
  "participant_id" INTEGER,
  "parent_identifier_snapshot" TEXT,
  "version" INTEGER NOT NULL,
  "photo_ids" JSONB NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_selection_submissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "group_selection_submissions_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "client_galleries"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "group_selection_submissions_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "gallery_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "group_selection_submissions_participant_id_version_key"
  ON "group_selection_submissions"("participant_id", "version");
CREATE INDEX "group_selection_submissions_gallery_id_status_submitted_at_idx"
  ON "group_selection_submissions"("gallery_id", "status", "submitted_at");
CREATE INDEX "group_selection_submissions_payload_hash_idx"
  ON "group_selection_submissions"("payload_hash");
