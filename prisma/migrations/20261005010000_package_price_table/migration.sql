-- Package prices become a table: a price per person for each kind of
-- traveller (rows) in each room type (columns) — for now Adult / Baby ×
-- Twin / Triple. Replaces the separate price columns added in
-- 20261005000000, which were never used in production.
--
-- price_per_pax and room_sharing are still read by the previously deployed
-- code, so they're dropped in a later migration once this code is live.

-- CreateTable
CREATE TABLE "package_prices" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "traveller" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "package_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "package_prices_package_id_traveller_room_key" ON "package_prices"("package_id", "traveller", "room");

-- AddForeignKey
ALTER TABLE "package_prices" ADD CONSTRAINT "package_prices_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Same lockdown as every app table (20260926000000_lock_down_public_data_api):
-- no Data API access; the app reads and writes through Prisma only.
ALTER TABLE "package_prices" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "package_prices" FROM anon, authenticated;

-- Each package had one price; every real package was marked "Twin" sharing,
-- so that price becomes the Adult / Twin room price.
INSERT INTO "package_prices" ("id", "package_id", "traveller", "room", "amount")
SELECT gen_random_uuid(), "id", 'ADULT', 'TWIN', "price_per_pax"
FROM "packages"
WHERE "price_per_pax" > 0;

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "price_infant",
DROP COLUMN "price_senior",
DROP COLUMN "price_triple",
DROP COLUMN "price_twin";
