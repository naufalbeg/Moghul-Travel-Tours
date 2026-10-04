-- Booking requests from the "Borang Tempahan" on package pages are stored as
-- inquiries (kind = BOOKING) with the chosen departure and the travellers as
-- priced at the time. Additive only: existing rows become kind = INQUIRY.

-- CreateEnum
CREATE TYPE "InquiryKind" AS ENUM ('INQUIRY', 'BOOKING');

-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "departure_date" DATE,
ADD COLUMN     "estimated_total" DECIMAL(10,2),
ADD COLUMN     "kind" "InquiryKind" NOT NULL DEFAULT 'INQUIRY',
ADD COLUMN     "package_id" UUID,
ADD COLUMN     "travellers" JSONB;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
