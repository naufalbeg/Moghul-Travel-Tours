-- Contract step of 20261005010000_package_price_table: the price table code is
-- live, so the single price (copied to ADULT / TWIN in package_prices, checked
-- unchanged before this ran) and the free-text room sharing are no longer read.

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "price_per_pax",
DROP COLUMN "room_sharing";
