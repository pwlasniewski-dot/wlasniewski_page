CREATE TABLE IF NOT EXISTS "report_deliveries" (
    "id" SERIAL NOT NULL,
    "report_key" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "error" TEXT,
    CONSTRAINT "report_deliveries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "report_deliveries_report_key_key" ON "report_deliveries"("report_key");
CREATE INDEX IF NOT EXISTS "report_deliveries_report_type_period_idx" ON "report_deliveries"("report_type", "period");
