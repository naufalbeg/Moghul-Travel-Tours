/**
 * Fixed site facts. Contact details, licences, the About text and social
 * links are editable by admins — see lib/site-content.ts (Module 6).
 */
export const SITE = {
  name: "Moghul Travel & Tours",
  legalName: "Moghul Travel & Tours Sdn Bhd",
} as const;

/**
 * "Other Packages": Moghul's agent page on Muslim Travel Bug's booking
 * portal (TravelCRM) — Moghul is a certified Muslim Travel Bug agent.
 */
export const OTHER_PACKAGES_URL = "https://app.travelcrm.co/destinations/moghultt-gmail-2";

/**
 * Top menu. Labels come from the visitor's dictionary (client.nav).
 * External links open in a new tab, so the visitor keeps our site open.
 */
export const PUBLIC_NAV = [
  { href: "/", key: "home" },
  { href: "/packages", key: "packages" },
  { href: OTHER_PACKAGES_URL, key: "otherPackages", external: true },
  { href: "/gallery", key: "gallery" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;
