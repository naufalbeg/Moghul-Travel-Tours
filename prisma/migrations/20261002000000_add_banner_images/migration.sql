-- CreateTable
CREATE TABLE "banner_images" (
    "id" UUID NOT NULL,
    "banner" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banner_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banner_images_banner_sort_order_idx" ON "banner_images"("banner", "sort_order");

-- Same lockdown as every app table (20260926000000_lock_down_public_data_api):
-- no Data API access; the app reads and writes through Prisma only.
ALTER TABLE "banner_images" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "banner_images" FROM anon, authenticated;
