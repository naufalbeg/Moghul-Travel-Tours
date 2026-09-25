import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** status = ACTIVE and not past its expiry date (REQ-MTT-007-004). */
export const liveAnnouncementWhere = (now: Date): Prisma.AnnouncementWhereInput => ({
  status: "ACTIVE",
  OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
});

/**
 * listActiveAnnouncements (SDD 4.2.7), newest first. Checked on every
 * request, so expired ones disappear without a cron job. Never breaks the
 * page: on a database error the bar is simply hidden.
 */
export const getActiveAnnouncements = cache(async () => {
  await connection();
  try {
    return await prisma.announcement.findMany({
      where: liveAnnouncementWhere(new Date()),
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, body: true },
    });
  } catch (error) {
    console.error("Failed to load announcements", error);
    return [];
  }
});
