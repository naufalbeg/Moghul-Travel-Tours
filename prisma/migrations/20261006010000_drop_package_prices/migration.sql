-- Contract step of 20261006000000_package_price_list_and_exclusions: the
-- price list code is live, so the old traveller × room table (copied to
-- package_price_list, checked unchanged before this ran) is no longer read.

-- Booking requests saved by the old code list travellers as
-- {traveller, room, count, amount}; the price list reads {type, count,
-- amount}. ADULT + TWIN → ADULT_TWIN, and so on. Safe to re-run.
UPDATE "inquiries" SET "travellers" = (
  SELECT jsonb_agg(
    CASE WHEN e ? 'type' THEN e
    ELSE jsonb_build_object('type', (e ->> 'traveller') || '_' || (e ->> 'room'), 'count', e -> 'count', 'amount', e -> 'amount')
    END ORDER BY i)
  FROM jsonb_array_elements("travellers") WITH ORDINALITY AS t(e, i))
WHERE jsonb_typeof("travellers") = 'array'
  AND EXISTS (SELECT 1 FROM jsonb_array_elements("travellers") AS e WHERE e ? 'traveller');

-- DropForeignKey
ALTER TABLE "package_prices" DROP CONSTRAINT "package_prices_package_id_fkey";

-- DropTable
DROP TABLE "package_prices";
