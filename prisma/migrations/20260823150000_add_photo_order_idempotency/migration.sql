-- Additive protection against duplicate gallery checkout requests.
ALTER TABLE "photo_orders" ADD COLUMN "idempotency_key" TEXT;
ALTER TABLE "photo_orders" ADD COLUMN "checkout_fingerprint" TEXT;
CREATE UNIQUE INDEX "photo_orders_idempotency_key_key" ON "photo_orders"("idempotency_key");
