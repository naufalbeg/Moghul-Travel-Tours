import type { Metadata } from "next";
import { DashboardView } from "@/components/admin/dashboard-view";
import { liveAnnouncementWhere } from "@/lib/announcements";
import { requireAdmin } from "@/lib/auth";
import { todayInMalaysia } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard" };

/** Dashboard: gathers the numbers; components/admin/dashboard-view.tsx lays them out. */
export default async function DashboardPage() {
  const admin = await requireAdmin();
  const today = todayInMalaysia();
  const live = { status: "PUBLISHED", deletedAt: null } as const;

  const [
    newInquiries,
    newBookings,
    publishedPackages,
    draftPackages,
    packagesWithoutDates,
    nextDeparture,
    galleryPhotos,
    testimonials,
    activeAnnouncements,
    recent,
  ] = await Promise.all([
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.inquiry.count({ where: { status: "NEW", kind: "BOOKING" } }),
    prisma.package.count({ where: live }),
    prisma.package.count({ where: { status: "DRAFT", deletedAt: null } }),
    prisma.package.count({ where: { ...live, departures: { none: { departureDate: { gte: today } } } } }),
    prisma.packageDeparture.findFirst({
      where: { departureDate: { gte: today }, package: live },
      orderBy: { departureDate: "asc" },
      select: { departureDate: true, package: { select: { title: true } } },
    }),
    prisma.galleryImage.count(),
    prisma.testimonial.count(),
    prisma.announcement.count({ where: liveAnnouncementWhere(new Date()) }),
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, packageInterest: true, status: true, kind: true, createdAt: true },
    }),
  ]);

  return (
    <DashboardView
      firstName={admin.name.split(" ")[0]}
      newInquiries={newInquiries}
      newBookings={newBookings}
      publishedPackages={publishedPackages}
      draftPackages={draftPackages}
      packagesWithoutDates={packagesWithoutDates}
      nextDeparture={nextDeparture?.departureDate ?? null}
      galleryPhotos={galleryPhotos}
      testimonials={testimonials}
      activeAnnouncements={activeAnnouncements}
      recent={recent}
    />
  );
}
