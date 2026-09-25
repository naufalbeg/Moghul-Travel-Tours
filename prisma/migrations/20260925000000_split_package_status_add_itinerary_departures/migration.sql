-- CreateEnum
CREATE TYPE "PackageAvailability" AS ENUM ('OPEN', 'ALMOST_FULL', 'FULL', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "DepartureAvailability" AS ENUM ('OPEN', 'ALMOST_FULL', 'FULL');

-- AlterEnum
BEGIN;
CREATE TYPE "PackageStatus_new" AS ENUM ('DRAFT', 'PUBLISHED');
ALTER TABLE "public"."packages" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "packages" ALTER COLUMN "status" TYPE "PackageStatus_new" USING ("status"::text::"PackageStatus_new");
ALTER TYPE "PackageStatus" RENAME TO "PackageStatus_old";
ALTER TYPE "PackageStatus_new" RENAME TO "PackageStatus";
DROP TYPE "public"."PackageStatus_old";
ALTER TABLE "packages" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "departure_dates",
DROP COLUMN "itinerary",
ADD COLUMN     "availability" "PackageAvailability" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "duration_days" SMALLINT,
ADD COLUMN     "duration_nights" SMALLINT,
ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "inclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "room_sharing" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "package_itinerary_days" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "day_start" SMALLINT NOT NULL,
    "day_end" SMALLINT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "package_itinerary_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_departures" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "departure_date" DATE NOT NULL,
    "availability" "DepartureAvailability" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_departures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_itinerary_days_package_id_idx" ON "package_itinerary_days"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_departures_package_id_departure_date_key" ON "package_departures"("package_id", "departure_date");

-- CreateIndex
CREATE INDEX "package_images_package_id_idx" ON "package_images"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "packages_slug_key" ON "packages"("slug");

-- CreateIndex
CREATE INDEX "packages_status_category_idx" ON "packages"("status", "category");

-- AddForeignKey
ALTER TABLE "package_itinerary_days" ADD CONSTRAINT "package_itinerary_days_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_departures" ADD CONSTRAINT "package_departures_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
