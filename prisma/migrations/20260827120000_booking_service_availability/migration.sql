-- Professional availability schedule per service and weekday.
-- Times are stored as minutes from the selected calendar day; values above
-- 1440 intentionally represent an end after midnight (maximum 02:00).

CREATE TABLE "booking_availability_rules" (
    "id" SERIAL NOT NULL,
    "service_key" VARCHAR(30) NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "slot_interval_minutes" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_availability_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "booking_availability_rules_day_check" CHECK ("day_of_week" BETWEEN 1 AND 7),
    CONSTRAINT "booking_availability_rules_start_check" CHECK ("start_minute" BETWEEN 0 AND 1439),
    CONSTRAINT "booking_availability_rules_end_check" CHECK ("end_minute" > "start_minute" AND "end_minute" <= 1560),
    CONSTRAINT "booking_availability_rules_interval_check" CHECK ("slot_interval_minutes" IN (30, 60))
);

CREATE UNIQUE INDEX "booking_availability_rules_service_key_day_of_week_key"
ON "booking_availability_rules"("service_key", "day_of_week");

CREATE INDEX "booking_availability_rules_service_key_enabled_idx"
ON "booking_availability_rules"("service_key", "enabled");

CREATE TABLE "booking_availability_exceptions" (
    "id" SERIAL NOT NULL,
    "service_key" VARCHAR(30) NOT NULL,
    "date" DATE NOT NULL,
    "mode" VARCHAR(20) NOT NULL,
    "start_minute" INTEGER,
    "end_minute" INTEGER,
    "slot_interval_minutes" INTEGER,
    "note" VARCHAR(160),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_availability_exceptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "booking_availability_exceptions_mode_check" CHECK ("mode" IN ('CLOSED', 'CUSTOM')),
    CONSTRAINT "booking_availability_exceptions_window_check" CHECK (
        ("mode" = 'CLOSED' AND "start_minute" IS NULL AND "end_minute" IS NULL AND "slot_interval_minutes" IS NULL)
        OR
        ("mode" = 'CUSTOM' AND "start_minute" BETWEEN 0 AND 1439 AND "end_minute" > "start_minute" AND "end_minute" <= 1560 AND "slot_interval_minutes" IN (30, 60))
    )
);

CREATE UNIQUE INDEX "booking_availability_exceptions_service_key_date_key"
ON "booking_availability_exceptions"("service_key", "date");

CREATE INDEX "booking_availability_exceptions_date_idx"
ON "booking_availability_exceptions"("date");

-- Safe starting schedule. The administrator can change every row later.
-- Monday=1 ... Sunday=7.
INSERT INTO "booking_availability_rules"
    ("service_key", "day_of_week", "enabled", "start_minute", "end_minute", "slot_interval_minutes")
VALUES
    ('SESJA', 1, true, 1080, 1320, 60),
    ('SESJA', 2, true, 1080, 1320, 60),
    ('SESJA', 3, true, 1080, 1320, 60),
    ('SESJA', 4, true, 1080, 1320, 60),
    ('SESJA', 5, true, 1080, 1320, 60),
    ('SESJA', 6, true, 540, 1200, 60),
    ('SESJA', 7, true, 540, 1200, 60),
    ('SLUB', 1, true, 1020, 1380, 60),
    ('SLUB', 2, true, 1020, 1380, 60),
    ('SLUB', 3, true, 1020, 1380, 60),
    ('SLUB', 4, true, 1020, 1380, 60),
    ('SLUB', 5, true, 1020, 1560, 60),
    ('SLUB', 6, true, 480, 1560, 60),
    ('SLUB', 7, true, 480, 1560, 60),
    ('PRZYJECIE', 1, true, 1020, 1380, 60),
    ('PRZYJECIE', 2, true, 1020, 1380, 60),
    ('PRZYJECIE', 3, true, 1020, 1380, 60),
    ('PRZYJECIE', 4, true, 1020, 1380, 60),
    ('PRZYJECIE', 5, true, 1020, 1560, 60),
    ('PRZYJECIE', 6, true, 480, 1560, 60),
    ('PRZYJECIE', 7, true, 480, 1560, 60),
    ('URODZINY', 1, true, 1020, 1380, 60),
    ('URODZINY', 2, true, 1020, 1380, 60),
    ('URODZINY', 3, true, 1020, 1380, 60),
    ('URODZINY', 4, true, 1020, 1380, 60),
    ('URODZINY', 5, true, 1020, 1560, 60),
    ('URODZINY', 6, true, 480, 1560, 60),
    ('URODZINY', 7, true, 480, 1560, 60),
    ('DRON', 1, true, 1020, 1260, 60),
    ('DRON', 2, true, 1020, 1260, 60),
    ('DRON', 3, true, 1020, 1260, 60),
    ('DRON', 4, true, 1020, 1260, 60),
    ('DRON', 5, true, 1020, 1260, 60),
    ('DRON', 6, true, 540, 1200, 60),
    ('DRON', 7, true, 540, 1200, 60);
