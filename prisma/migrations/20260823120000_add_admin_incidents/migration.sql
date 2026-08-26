CREATE TYPE "AdminIncidentSeverity" AS ENUM ('P0', 'P1', 'P2', 'P3');
CREATE TYPE "AdminIncidentStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

CREATE TABLE "admin_incidents" (
    "id" UUID NOT NULL,
    "severity" "AdminIncidentSeverity" NOT NULL,
    "category" TEXT NOT NULL,
    "status" "AdminIncidentStatus" NOT NULL DEFAULT 'OPEN',
    "reason_code" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "client_id" INTEGER,
    "client_email" TEXT,
    "entity_type" TEXT,
    "entity_id" INTEGER,
    "correlation_id" UUID,
    "details" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "admin_incidents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_incidents_status_severity_occurred_at_idx"
    ON "admin_incidents"("status", "severity", "occurred_at");
CREATE INDEX "admin_incidents_category_status_occurred_at_idx"
    ON "admin_incidents"("category", "status", "occurred_at");
CREATE INDEX "admin_incidents_client_id_occurred_at_idx"
    ON "admin_incidents"("client_id", "occurred_at");
CREATE INDEX "admin_incidents_correlation_id_idx"
    ON "admin_incidents"("correlation_id");
CREATE INDEX "admin_incidents_occurred_at_idx"
    ON "admin_incidents"("occurred_at");

ALTER TABLE "admin_incidents"
    ADD CONSTRAINT "admin_incidents_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
