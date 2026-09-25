import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  ImageIcon,
  MailIcon,
  MegaphoneIcon,
  PackageIcon,
  PlusIcon,
  StarIcon,
} from "@/components/ui/icons";
import type { InquiryStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard" };

const statusPill: Record<InquiryStatus, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-accent-pale text-accent-dark" },
  IN_PROGRESS: { label: "In progress", className: "bg-primary-pale text-primary" },
  RESOLVED: { label: "Resolved", className: "bg-success-pale text-success" },
};

const quickActions = [
  { href: "/admin/packages/new", label: "Add new package" },
  { href: "/admin/announcements", label: "Post announcement" },
  { href: "/admin/gallery", label: "Upload gallery photos" },
  { href: "/admin/testimonials", label: "Add testimonial" },
];

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const now = new Date();

  const [newInquiries, publishedPackages, galleryPhotos, testimonials, activeAnnouncements, recent] =
    await Promise.all([
      prisma.inquiry.count({ where: { status: "NEW" } }),
      prisma.package.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      prisma.galleryImage.count(),
      prisma.testimonial.count(),
      prisma.announcement.count({
        where: { status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      }),
      prisma.inquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, fullName: true, packageInterest: true, status: true },
      }),
    ]);

  const stats: {
    value: number;
    label: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    highlight?: boolean;
  }[] = [
    { value: newInquiries, label: "New inquiries", Icon: MailIcon, highlight: true },
    { value: publishedPackages, label: "Published packages", Icon: PackageIcon },
    { value: galleryPhotos, label: "Gallery photos", Icon: ImageIcon },
    { value: testimonials, label: "Testimonials", Icon: StarIcon },
    { value: activeAnnouncements, label: "Active announcements", Icon: MegaphoneIcon },
  ];

  return (
    <>
      <h2 className="mb-1 text-2xl">Welcome back, {admin.name.split(" ")[0]}</h2>
      <p className="mb-7 text-muted">Here&apos;s what&apos;s happening across the site today.</p>

      <ul className="mb-8 grid grid-cols-2 gap-[18px] md:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ value, label, Icon, highlight }) => (
          <li
            key={label}
            className={`rounded-xl border p-5 ${highlight ? "border-accent bg-accent-pale" : "border-line bg-white"}`}
          >
            <span
              className={`mb-3.5 flex size-[38px] items-center justify-center rounded-[9px] ${
                highlight ? "bg-accent/15 text-accent-dark" : "bg-primary-pale text-primary"
              }`}
            >
              <Icon className="size-5" />
            </span>
            <div className="font-heading text-[28px] font-bold">{value}</div>
            <div className="text-sm font-medium text-muted">{label}</div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <section className="w-full rounded-xl border border-line bg-white px-6 py-[22px] lg:flex-[1.6]">
          <h3 className="mb-4 text-[17px]">Recent inquiries</h3>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-muted">No inquiries yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((inquiry) => {
                const pill = statusPill[inquiry.status];
                return (
                  <li key={inquiry.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <div className="font-semibold">{inquiry.fullName}</div>
                      <div className="text-sm text-muted">
                        {inquiry.packageInterest ?? "General inquiry"}
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${pill.className}`}>
                      {pill.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/admin/inquiries"
            className="mt-3.5 block text-center text-sm font-semibold text-primary"
          >
            View all inquiries →
          </Link>
        </section>

        <section className="w-full rounded-xl border border-line bg-white px-6 py-[22px] lg:flex-1">
          <h3 className="mb-4 text-[17px]">Quick actions</h3>
          <ul className="space-y-2.5">
            {quickActions.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-3 text-[14.5px] font-semibold hover:border-primary"
                >
                  <PlusIcon className="size-[18px] shrink-0 text-accent-dark" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
