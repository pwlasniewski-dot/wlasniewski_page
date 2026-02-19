-- AlterTable
ALTER TABLE "client_galleries" ADD COLUMN     "client_id" INTEGER;

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "client_selection" JSONB,
ADD COLUMN     "negotiation_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "photo_orders" ADD COLUMN     "product_ids" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "last_failed_login" TIMESTAMP(3),
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expires" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "gallery_products" (
    "id" SERIAL NOT NULL,
    "gallery_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image_url" TEXT,
    "video_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_token_key" ON "users"("reset_token");

-- AddForeignKey
ALTER TABLE "client_galleries" ADD CONSTRAINT "client_galleries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_products" ADD CONSTRAINT "gallery_products_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "client_galleries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

