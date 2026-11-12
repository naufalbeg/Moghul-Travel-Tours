import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, CheckCircleIcon, PlusIcon } from "@/components/ui/icons";
import type { InquiryKind, InquiryStatus } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/format";
import { INQUIRY_STATUS, formatReceived } from "@/lib/inquiry-labels";

export type DashboardData = {
  firstName: string;
  newInquiries: number;
  newBookings: number;
  publishedPackages: number;
  draftPackages: number;
  packagesWithoutDates: number;
  nextDeparture: Date | null;
  galleryPhotos: number;
  testimonials: number;
  activeAnnouncements: number;
  recent: {
    id: string;
    fullName: string;
    packageInterest: string | null;
    status: InquiryStatus;
    kind: InquiryKind;
    createdAt: Date;
  }[];
};

const quickActions = [
  { href: "/admin/packages/new", label: "Add a package" },
  { href: "/admin/announcements/new", label: "Post an announcement" },
  { href: "/admin/gallery", label: "Upload gallery photos" },
  { href: "/admin/testimonials/new", label: "Add a testimonial" },
];

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);

/** One thing that needs doing: what it is, why it matters, and the link that deals with it. */
function Task({ href, title, children, action }: { href: string; title: string; children: ReactNode; action: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-4 transition-colors duration-150 ease-smooth hover:bg-canvas sm:px-6"
      >
        <span className="min-w-0">
          <strong className="block text-primary-dark">{title}</strong>
          <span className="text-sm text-muted">{children}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary">
          {action}
          <ArrowRightIcon className="size-4 transition-transform duration-250 ease-smooth group-hover:translate-x-[3px]" />
        </span>
      </Link>
    </li>
  );
}

/** One fact about the live site, as a row: label, value, where to change it. */
function Fact({ label, href, children }: { label: string; href: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right font-bold">
        <Link href={href} className="text-ink hover:text-primary hover:underline">
          {children}
        </Link>
      </dd>
    </div>
  );
}

/**
 * The dashboard's layout: what needs attention first (a to-do list, each row
 * linking to where it is dealt with), then the latest inquiries, the state
 * of the live site and the usual shortcuts. No counters for their own sake.
 * The numbers come from app/admin/(portal)/page.tsx.
 */
export function DashboardView({
  firstName,
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
}: DashboardData) {
  const tasks = [
    newInquiries > 0 && (
      <Task key="inquiries" href="/admin/inquiries?status=new" title={`${plural(newInquiries, "new inquiry", "new inquiries")} to answer`} action="Open inquiries">
        {newBookings > 0
          ? `${plural(newBookings, "is a booking request", "are booking requests")} — these visitors are waiting to hear back.`
          : "Visitors are waiting to hear back."}
      </Task>
    ),
    packagesWithoutDates > 0 && (
      <Task
        key="dates"
        href="/admin/packages"
        title={`${plural(packagesWithoutDates, "published package has", "published packages have")} no upcoming departure date`}
        action="Review packages"
      >
        Visitors can&apos;t book these online until a date is added.
      </Task>
    ),
    draftPackages > 0 && (
      <Task key="drafts" href="/admin/packages" title={`${plural(draftPackages, "draft package", "draft packages")} not published yet`} action="Review drafts">
        Drafts are hidden from the website until you publish them.
      </Task>
    ),
    testimonials === 0 && (
      <Task key="reviews" href="/admin/testimonials/new" title="No customer reviews on the website yet" action="Add the first">
        The reviews page and the homepage show them as soon as one is added.
      </Task>
    ),
  ].filter(Boolean);

  return (
    <>
      <h2 className="text-title text-primary-dark">Hello, {firstName}</h2>
      <p className="mt-1 mb-7 text-muted">
        {tasks.length > 0
          ? `${plural(tasks.length, "thing needs", "things need")} your attention.`
          : "Nothing needs your attention right now."}
      </p>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="tasks-title" className="overflow-hidden rounded-xl border border-line bg-white">
            <h3 id="tasks-title" className="border-b border-line px-5 py-4 text-body sm:px-6">
              Needs your attention
            </h3>
            {tasks.length > 0 ? (
              <ul className="divide-y divide-line">{tasks}</ul>
            ) : (
              <p className="flex items-center gap-2.5 px-5 py-6 text-muted sm:px-6">
                <CheckCircleIcon className="size-5 shrink-0 text-success" />
                All caught up: no new inquiries, and every published package has a departure date.
              </p>
            )}
          </section>

          <section aria-labelledby="recent-title" className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <h3 id="recent-title" className="text-body">
                Latest inquiries
              </h3>
              <Link href="/admin/inquiries" className="text-sm font-bold text-primary hover:underline">
                View all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="px-5 py-6 text-muted sm:px-6">
                Nothing yet. When a visitor sends the inquiry or booking form, it appears here and you get an email.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((inquiry) => {
                  const pill = INQUIRY_STATUS[inquiry.status];
                  return (
                    <li key={inquiry.id}>
                      <Link
                        href={`/admin/inquiries/${inquiry.id}`}
                        className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-150 ease-smooth hover:bg-canvas sm:px-6"
                      >
                        <span className="min-w-0">
                          <strong className="block truncate">{inquiry.fullName}</strong>
                          <span className="block truncate text-sm text-muted">
                            {inquiry.kind === "BOOKING" && <strong className="text-primary">Booking request · </strong>}
                            {inquiry.packageInterest ?? "General inquiry"} · {formatReceived(inquiry.createdAt)}
                          </span>
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[13px] font-bold whitespace-nowrap ${pill.className}`}>
                          {pill.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section aria-labelledby="site-title" className="rounded-xl border border-line bg-white px-5 py-4 sm:px-6">
            <h3 id="site-title" className="mb-1 text-body">
              On the website now
            </h3>
            <dl>
              <Fact label="Published packages" href="/admin/packages">
                {publishedPackages}
              </Fact>
              <Fact label="Next departure" href="/admin/packages">
                {nextDeparture ? formatDate(nextDeparture) : "None scheduled"}
              </Fact>
              <Fact label="Gallery photos" href="/admin/gallery">
                {galleryPhotos}
              </Fact>
              <Fact label="Customer reviews" href="/admin/testimonials">
                {testimonials}
              </Fact>
              <Fact label="Announcements showing" href="/admin/announcements">
                {activeAnnouncements}
              </Fact>
            </dl>
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="mt-3 inline-flex min-h-9 items-center text-sm font-bold text-primary hover:underline"
            >
              Open the website
            </a>
          </section>

          <section aria-labelledby="actions-title" className="rounded-xl border border-line bg-white px-5 py-4 sm:px-6">
            <h3 id="actions-title" className="mb-2 text-body">
              Shortcuts
            </h3>
            <ul>
              {quickActions.map(({ href, label }) => (
                <li key={href} className="border-b border-line last:border-b-0">
                  <Link href={href} className="flex min-h-11 items-center gap-2.5 font-semibold hover:text-primary">
                    <PlusIcon className="size-[18px] shrink-0 text-primary" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
