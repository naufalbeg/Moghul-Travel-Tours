import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

// One-time "set your password" links, used for admin invitations (24h, SRS
// UC-MTT-001 A1) and password resets (1h). Only a SHA-256 hash of the token
// is stored, so a database leak doesn't expose usable links.

export const INVITE_HOURS = 24;
export const RESET_HOURS = 1;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Issues a fresh token for the user (replacing any previous one). Returns the raw token. */
export async function issuePasswordToken(userId: string, hours: number) {
  const token = randomBytes(32).toString("base64url");
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordTokenHash: hash(token),
      passwordTokenExpiresAt: new Date(Date.now() + hours * 3_600_000),
    },
  });
  return token;
}

/**
 * Looks up the user a token belongs to. Returns `expired` for a real but
 * lapsed link, so the page can say "ask for a new one" instead of "invalid".
 */
export async function findPasswordToken(token: string | undefined) {
  if (!token || token.length > 100) return { status: "invalid" as const };
  const user = await prisma.user.findUnique({
    where: { passwordTokenHash: hash(token) },
    select: { id: true, name: true, email: true, isActive: true, joinedAt: true, passwordTokenExpiresAt: true },
  });
  if (!user || !user.isActive) return { status: "invalid" as const };
  if (!user.passwordTokenExpiresAt || user.passwordTokenExpiresAt < new Date()) {
    return { status: "expired" as const, user };
  }
  return { status: "valid" as const, user };
}

export const setPasswordUrl = (baseUrl: string, token: string) =>
  `${baseUrl}/admin/set-password?token=${encodeURIComponent(token)}`;
