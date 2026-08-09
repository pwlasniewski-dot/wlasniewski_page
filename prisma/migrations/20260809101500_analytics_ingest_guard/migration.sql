CREATE TABLE IF NOT EXISTS "analytics_rate_limits" (
    "signal_hash" VARCHAR(64) NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "event_count" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_rate_limits_pkey" PRIMARY KEY ("signal_hash", "window_start")
);

CREATE INDEX IF NOT EXISTS "analytics_rate_limits_window_start_idx"
    ON "analytics_rate_limits"("window_start");

CREATE TABLE IF NOT EXISTS "analytics_ingest_metrics" (
    "id" SERIAL NOT NULL,
    "bucket_start" TIMESTAMP(3) NOT NULL,
    "reason_code" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "batch_count" INTEGER NOT NULL DEFAULT 0,
    "event_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_ingest_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "analytics_ingest_metrics_bucket_reason_outcome_key"
    ON "analytics_ingest_metrics"("bucket_start", "reason_code", "outcome");
CREATE INDEX IF NOT EXISTS "analytics_ingest_metrics_bucket_start_idx"
    ON "analytics_ingest_metrics"("bucket_start");
