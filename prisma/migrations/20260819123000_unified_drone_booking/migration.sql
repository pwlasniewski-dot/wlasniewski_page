ALTER TABLE "bookings"
    ADD COLUMN "client_id" INTEGER,
    ADD COLUMN "booking_source" VARCHAR(120),
    ADD COLUMN "booking_kind" VARCHAR(30) DEFAULT 'STANDARD',
    ADD COLUMN "company_name" TEXT,
    ADD COLUMN "base_price" INTEGER,
    ADD COLUMN "drone_package_slug" VARCHAR(80),
    ADD COLUMN "drone_package_name" TEXT,
    ADD COLUMN "drone_price" INTEGER,
    ADD COLUMN "drone_goal" TEXT,
    ADD COLUMN "drone_terms_accepted_at" TIMESTAMP(3),
    ADD COLUMN "flight_check_status" VARCHAR(30),
    ADD COLUMN "blocks_entire_day" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "booking_snapshot" JSONB;

CREATE INDEX "bookings_client_id_idx" ON "bookings"("client_id");
CREATE INDEX "bookings_drone_package_slug_idx" ON "bookings"("drone_package_slug");

ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
