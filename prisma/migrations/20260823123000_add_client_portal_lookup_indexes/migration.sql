CREATE INDEX "offers_client_id_status_created_at_idx"
    ON "offers"("client_id", "status", "created_at");
CREATE INDEX "offers_client_email_status_created_at_idx"
    ON "offers"("client_email", "status", "created_at");
CREATE INDEX "contracts_client_id_status_created_at_idx"
    ON "contracts"("client_id", "status", "created_at");
CREATE INDEX "client_galleries_client_id_is_active_created_at_idx"
    ON "client_galleries"("client_id", "is_active", "created_at");
CREATE INDEX "client_galleries_client_email_is_active_created_at_idx"
    ON "client_galleries"("client_email", "is_active", "created_at");
