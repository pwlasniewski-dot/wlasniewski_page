ALTER TABLE "admin_incidents"
    ADD COLUMN "notification_status" TEXT NOT NULL DEFAULT 'PENDING',
    ADD COLUMN "notification_attempted_at" TIMESTAMP(3),
    ADD COLUMN "notification_sent_at" TIMESTAMP(3),
    ADD COLUMN "notification_error" TEXT;

CREATE INDEX "admin_incidents_notification_status_occurred_at_idx"
    ON "admin_incidents"("notification_status", "occurred_at");
