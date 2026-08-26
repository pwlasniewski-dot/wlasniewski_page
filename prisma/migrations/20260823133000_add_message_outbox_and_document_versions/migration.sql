CREATE TABLE "message_outbox" (
    "id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "message_type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "message_outbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_deliveries" (
    "id" UUID NOT NULL,
    "outbox_id" UUID NOT NULL,
    "attempt_no" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "error" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "message_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offer_versions" (
    "id" UUID NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "pdf_key" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    CONSTRAINT "offer_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_versions" (
    "id" UUID NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "pdf_key" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    CONSTRAINT "contract_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "message_outbox_idempotency_key_key" ON "message_outbox"("idempotency_key");
CREATE INDEX "message_outbox_status_available_at_idx" ON "message_outbox"("status", "available_at");
CREATE INDEX "message_outbox_entity_type_entity_id_created_at_idx" ON "message_outbox"("entity_type", "entity_id", "created_at");
CREATE INDEX "message_outbox_recipient_created_at_idx" ON "message_outbox"("recipient", "created_at");
CREATE UNIQUE INDEX "message_deliveries_outbox_id_attempt_no_key" ON "message_deliveries"("outbox_id", "attempt_no");
CREATE INDEX "message_deliveries_status_attempted_at_idx" ON "message_deliveries"("status", "attempted_at");
CREATE UNIQUE INDEX "offer_versions_offer_id_version_key" ON "offer_versions"("offer_id", "version");
CREATE INDEX "offer_versions_offer_id_created_at_idx" ON "offer_versions"("offer_id", "created_at");
CREATE INDEX "offer_versions_payload_hash_idx" ON "offer_versions"("payload_hash");
CREATE UNIQUE INDEX "contract_versions_contract_id_version_key" ON "contract_versions"("contract_id", "version");
CREATE INDEX "contract_versions_contract_id_created_at_idx" ON "contract_versions"("contract_id", "created_at");
CREATE INDEX "contract_versions_payload_hash_idx" ON "contract_versions"("payload_hash");

ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_outbox_id_fkey"
    FOREIGN KEY ("outbox_id") REFERENCES "message_outbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_versions" ADD CONSTRAINT "offer_versions_offer_id_fkey"
    FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contract_versions" ADD CONSTRAINT "contract_versions_contract_id_fkey"
    FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
