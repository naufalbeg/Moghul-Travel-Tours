import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  // DATABASE_URL is Supabase's Transaction pooler (port 6543), built for
  // serverless: many short-lived connections. (The Session pooler caps all
  // clients at 15, which several warm Vercel instances exhaust — that caused
  // "max clients reached" outages.) Keep each instance's pool small and let
  // idle connections close.
  const adapter = new PrismaPg({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

// Reuse one client across dev hot reloads so we don't leak connection pools.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
