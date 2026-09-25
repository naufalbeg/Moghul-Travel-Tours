/**
 * Absolute base URL of the live site (for sitemaps, link previews and email
 * links). Uses Vercel's production domain when deployed.
 */
export function siteUrl() {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
