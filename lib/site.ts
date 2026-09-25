/**
 * Static site facts used by the shared layout.
 *
 * PLACEHOLDERS: the contact details below are copied from the mockups and are
 * not the real business details. In Module 6 (Manage Content Pages) these
 * become defaults that site_config rows override.
 */
export const SITE = {
  name: "Moghul Travel & Tours",
  legalName: "Moghul Travel & Tours Sdn Bhd",
  tagline: "Sdn Bhd · MOTAC licensed",
  address: "Lot 12, Jalan Tun Razak, 50400 Kuala Lumpur",
  phone: "03-1234 5678",
  /** International format, digits only, for tel: and wa.me links. */
  phoneIntl: "60312345678",
  whatsappIntl: "60312345678",
  email: "hello@moghultt.com",
  officeHours: "Mon–Fri, 9am–6pm",
  motacLicense: "MOTAC License No. MTT-XXXX",
  mattaMember: "MATTA Member No. XXXX",
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
  },
} as const;

export const whatsappUrl = (text?: string) =>
  `https://wa.me/${SITE.whatsappIntl}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Packages" },
  { href: "/packages?category=umrah", label: "Umrah" },
  { href: "/packages?category=ziarah", label: "Ziarah" },
  { href: "/packages?category=group-tour", label: "Group Tours" },
  { href: "/packages?category=domestic", label: "Domestic" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;
