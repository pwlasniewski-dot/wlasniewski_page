CREATE TABLE IF NOT EXISTS "payment_ledger" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_payment_id" TEXT NOT NULL,
    "external_order_id" TEXT,
    "resource_type" TEXT,
    "resource_id" INTEGER,
    "payment_kind" TEXT NOT NULL DEFAULT 'FULL',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "paid_at" TIMESTAMP(3) NOT NULL,
    "refunded_amount" INTEGER NOT NULL DEFAULT 0,
    "refunded_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_ledger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_ledger_provider_provider_payment_id_key"
    ON "payment_ledger"("provider", "provider_payment_id");
CREATE INDEX IF NOT EXISTS "payment_ledger_paid_at_status_idx" ON "payment_ledger"("paid_at", "status");
CREATE INDEX IF NOT EXISTS "payment_ledger_resource_type_resource_id_idx" ON "payment_ledger"("resource_type", "resource_id");
