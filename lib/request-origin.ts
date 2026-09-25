import "server-only";
import { headers } from "next/headers";
import { siteUrl } from "@/lib/site-url";

/** The origin the current request came in on (e.g. https://moghultt.com), for links we hand out. */
export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return siteUrl();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
