-- A client-generated UUID makes Aero Analiza lead creation idempotent across
-- retries and concurrent serverless invocations.
ALTER TABLE "inquiries" ADD COLUMN "external_id" TEXT;
CREATE UNIQUE INDEX "inquiries_external_id_key" ON "inquiries"("external_id");
