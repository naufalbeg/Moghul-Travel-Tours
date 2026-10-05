-- The owner's final price list (2026-10-06): one price per person for each
-- price type (Adult Twin, Adult Triple, Single, Child Twin, Child with Bed,
-- Child No Bed, Infant) instead of the traveller × room table. Plus a
-- "Not included" list on packages.
--
-- package_prices is still read by the previously deployed code, so it's
-- copied here and dropped in a later migration once this code is live.

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "exclusions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "package_price_list" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "package_price_list_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "package_price_list_package_id_type_key" ON "package_price_list"("package_id", "type");

-- AddForeignKey
ALTER TABLE "package_price_list" ADD CONSTRAINT "package_price_list_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Same lockdown as every app table (20260926000000_lock_down_public_data_api):
-- no Data API access; the app reads and writes through Prisma only.
ALTER TABLE "package_price_list" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "package_price_list" FROM anon, authenticated;

-- Adult / Twin room → Adult Twin, and so on. Only Adult Twin and Child Twin
-- were ever filled in; there's no Child Triple type, so none is copied.
INSERT INTO "package_price_list" ("id", "package_id", "type", "amount")
SELECT gen_random_uuid(), "package_id", "traveller" || '_' || "room", "amount"
FROM "package_prices"
WHERE ("traveller", "room") IN (('ADULT', 'TWIN'), ('ADULT', 'TRIPLE'), ('CHILD', 'TWIN'));
