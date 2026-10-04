-- A package now lists up to five prices per person (adult, twin room, triple
-- room, senior citizen, baby), all optional. The original single price stays
-- in price_per_pax as the adult price; 0 meant "not set yet" on drafts, so it
-- becomes NULL.
--
-- room_sharing is no longer used but is dropped in a later migration, once
-- the code that stops reading it is live (dev and prod share this database).

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "price_infant" DECIMAL(10,2),
ADD COLUMN     "price_senior" DECIMAL(10,2),
ADD COLUMN     "price_triple" DECIMAL(10,2),
ADD COLUMN     "price_twin" DECIMAL(10,2),
ALTER COLUMN "price_per_pax" DROP NOT NULL;

UPDATE "packages" SET "price_per_pax" = NULL WHERE "price_per_pax" <= 0;
