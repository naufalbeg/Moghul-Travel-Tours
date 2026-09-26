-- Package categories become Umrah & Ziarah / Outbound / Inbound / Cruise.
-- Group Tour and Domestic are renamed in place, so existing packages move
-- across with them; Cruise is new.
ALTER TYPE "PackageCategory" RENAME VALUE 'GROUP_TOUR' TO 'OUTBOUND';
ALTER TYPE "PackageCategory" RENAME VALUE 'DOMESTIC' TO 'INBOUND';
ALTER TYPE "PackageCategory" ADD VALUE 'CRUISE';
