CREATE TABLE "page_analytics_registry" (
  "id" SERIAL NOT NULL,
  "site_host" VARCHAR(100) NOT NULL,
  "path" VARCHAR(500) NOT NULL,
  "first_published_at" TIMESTAMP(3),
  "first_seen_analytics_at" TIMESTAMP(3),
  "first_seen_gsc_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "page_analytics_registry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "page_analytics_registry_site_host_path_key" ON "page_analytics_registry"("site_host", "path");
CREATE INDEX "page_analytics_registry_first_published_at_idx" ON "page_analytics_registry"("first_published_at");
