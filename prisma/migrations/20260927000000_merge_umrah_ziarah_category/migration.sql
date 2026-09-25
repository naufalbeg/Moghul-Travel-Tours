-- Umrah and Ziarah become a single package category, UMRAH_ZIARAH.
-- Existing UMRAH / ZIARAH rows are mapped across rather than rejected.
BEGIN;
CREATE TYPE "PackageCategory_new" AS ENUM ('UMRAH_ZIARAH', 'GROUP_TOUR', 'DOMESTIC');
ALTER TABLE "packages" ALTER COLUMN "category" TYPE "PackageCategory_new" USING (
  CASE WHEN "category"::text IN ('UMRAH', 'ZIARAH') THEN 'UMRAH_ZIARAH' ELSE "category"::text END
)::"PackageCategory_new";
ALTER TYPE "PackageCategory" RENAME TO "PackageCategory_old";
ALTER TYPE "PackageCategory_new" RENAME TO "PackageCategory";
DROP TYPE "PackageCategory_old";
COMMIT;
