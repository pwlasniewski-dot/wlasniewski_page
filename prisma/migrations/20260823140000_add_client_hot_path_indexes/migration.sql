CREATE INDEX "bookings_email_status_date_idx" ON "bookings"("email", "status", "date");
CREATE INDEX "gift_cards_owner_id_created_at_idx" ON "gift_cards"("owner_id", "created_at");
CREATE INDEX "gift_card_orders_user_id_created_at_idx" ON "gift_card_orders"("user_id", "created_at");
CREATE INDEX "photo_orders_gallery_id_created_at_idx" ON "photo_orders"("gallery_id", "created_at");
