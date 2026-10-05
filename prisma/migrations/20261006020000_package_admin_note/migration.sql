-- An admins-only note on each package (owner's request, 2026-10-06), e.g.
-- whether it's Moghul's own package or Suka Travels'. Never shown on the
-- website. Additive: the deployed code doesn't read or write it.

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "admin_note" TEXT NOT NULL DEFAULT '';
