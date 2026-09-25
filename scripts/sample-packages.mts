/**
 * Adds or removes SAMPLE packages (taken from the mockups) for trying out
 * the public pages.
 *
 * ⚠ Local dev and the live site share one database, so published samples
 * show up on the real website. Always remove them when done:
 *
 *   npm run sample-packages            # add
 *   npm run sample-packages -- --remove
 *
 * Every sample slug starts with "sample-", which is what --remove deletes.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 1 }),
});

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

const samples: Prisma.PackageCreateInput[] = [
  {
    slug: "sample-umrah-sakinah-10-days",
    title: "Umrah Sakinah — 10 days",
    category: "UMRAH_ZIARAH",
    status: "PUBLISHED",
    availability: "ALMOST_FULL",
    pricePerPax: 9800,
    durationDays: 10,
    durationNights: 9,
    roomSharing: "Twin / triple sharing",
    description:
      "A gentle, well-paced Umrah journey through Makkah and Madinah, designed with families and older travellers in mind. We keep hotels close to the Haramain to minimise walking, and our group leader is with you throughout — from the airport to your final ziarah stop.",
    highlights: [
      "Makkah & Madinah, 4-star hotels near the Haramain",
      "Experienced group leader throughout the journey",
    ],
    inclusions: [
      "Return flights from Kuala Lumpur",
      "4-star hotels near the Haramain",
      "Daily halal breakfast & dinner",
      "Visa & Umrah permit processing",
      "Experienced group leader & ustaz",
      "Airport & inter-city transfers",
    ],
    itinerary: {
      create: [
        { dayStart: 1, title: "Depart Kuala Lumpur → Madinah", description: "Group check-in and departure. Arrival in Madinah, transfer to hotel and rest.", sortOrder: 0 },
        { dayStart: 2, dayEnd: 4, title: "Madinah — Masjid Nabawi", description: "Daily prayers at Masjid Nabawi, guided ziarah to key historical sites around Madinah.", sortOrder: 1 },
        { dayStart: 5, title: "Madinah → Makkah", description: "Depart for Makkah by coach, Umrah performed together as a group upon arrival.", sortOrder: 2 },
        { dayStart: 6, dayEnd: 8, title: "Makkah — Masjid al-Haram", description: "Daily prayers at Masjid al-Haram, guided ziarah around Makkah, free time for personal worship.", sortOrder: 3 },
        { dayStart: 9, title: "Free day & farewell Tawaf", description: "Rest, last-minute shopping in Makkah, and a farewell Tawaf before departure preparations.", sortOrder: 4 },
        { dayStart: 10, title: "Makkah → Kuala Lumpur", description: "Transfer to Jeddah airport for the return flight home.", sortOrder: 5 },
      ],
    },
    departures: {
      create: [
        { departureDate: d("2027-03-14"), availability: "OPEN" },
        { departureDate: d("2027-05-02"), availability: "ALMOST_FULL" },
        { departureDate: d("2027-06-21"), availability: "FULL" },
      ],
    },
  },
  {
    slug: "sample-umrah-barakah-12-days",
    title: "Umrah Barakah — 12 days",
    category: "UMRAH_ZIARAH",
    status: "PUBLISHED",
    pricePerPax: 12500,
    durationDays: 12,
    durationNights: 11,
    description: "An extended Umrah with more time in both holy cities and a scenic day trip to Taif.",
    highlights: ["Extended stay with a scenic Taif day trip included", "5-star hotels, walking distance to both Haramain"],
    departures: { create: [{ departureDate: d("2027-04-10") }, { departureDate: d("2027-07-05") }] },
  },
  {
    slug: "sample-ziarah-aqsa-jordan-9-days",
    title: "Ziarah Aqsa & Jordan — 9 days",
    category: "UMRAH_ZIARAH",
    status: "PUBLISHED",
    pricePerPax: 11200,
    durationDays: 9,
    durationNights: 8,
    description: "Visit Masjid Al-Aqsa, Petra and the Dead Sea with guides who know the history well.",
    highlights: ["Masjid Al-Aqsa, Petra, and the Dead Sea", "Guided by scholars familiar with the historic sites"],
    departures: { create: [{ departureDate: d("2027-03-28") }] },
  },
  {
    slug: "sample-historic-turkiye-8-days",
    title: "Historic Turkiye — 8 days",
    category: "GROUP_TOUR",
    status: "PUBLISHED",
    pricePerPax: 6500,
    durationDays: 8,
    durationNights: 7,
    description: "Istanbul, Cappadocia and Bursa at a relaxed pace.",
    highlights: ["Istanbul, Cappadocia, and Bursa at a relaxed pace", "Comfortable coaches and halal dining throughout"],
    departures: { create: [{ departureDate: d("2027-04-18") }, { departureDate: d("2027-09-12") }] },
  },
  {
    slug: "sample-langkawi-family-getaway-4-days",
    title: "Langkawi Family Getaway — 4 days",
    category: "DOMESTIC",
    status: "PUBLISHED",
    availability: "FULL",
    pricePerPax: 1200,
    durationDays: 4,
    durationNights: 3,
    description: "Beach resort stay with a cable car ride and an island-hopping day.",
    highlights: ["Beach resort stay with a cable car and island hop day", "Ideal for multi-generation family trips"],
  },
  {
    slug: "sample-bandung-heritage-tour-5-days",
    title: "Bandung Heritage Tour — 5 days",
    category: "GROUP_TOUR",
    status: "DRAFT",
    pricePerPax: 2800,
    description: "Draft sample — should NOT appear on the public site.",
    highlights: ["Colonial old town, tea plantations, and local markets"],
  },
];

try {
  const removed = await prisma.package.deleteMany({ where: { slug: { startsWith: "sample-" } } });
  console.log(`Removed ${removed.count} sample package(s).`);

  if (!process.argv.includes("--remove")) {
    for (const data of samples) await prisma.package.create({ data });
    console.log(`Added ${samples.length} sample packages. Remove them with --remove when done.`);
  }
} finally {
  await prisma.$disconnect();
}
