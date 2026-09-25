/**
 * Fixed site facts. Contact details, licences, the About text and social
 * links are editable by admins — see lib/site-content.ts (Module 6).
 */
export const SITE = {
  name: "Moghul Travel & Tours",
  legalName: "Moghul Travel & Tours Sdn Bhd",
} as const;

export const PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Packages" },
  { href: "/packages?category=umrah-ziarah", label: "Umrah & Ziarah" },
  { href: "/packages?category=group-tour", label: "Group Tours" },
  { href: "/packages?category=domestic", label: "Domestic" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;
