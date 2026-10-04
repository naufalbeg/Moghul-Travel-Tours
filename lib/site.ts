/**
 * Fixed site facts. Contact details, licences, the About text and social
 * links are editable by admins — see lib/site-content.ts (Module 6).
 */
export const SITE = {
  name: "Moghul Travel & Tours",
  legalName: "Moghul Travel & Tours Sdn Bhd",
} as const;

/** Top menu. Labels come from the visitor's dictionary (client.nav). */
export const PUBLIC_NAV = [
  { href: "/", key: "home" },
  { href: "/packages", key: "packages" },
  { href: "/gallery", key: "gallery" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;
