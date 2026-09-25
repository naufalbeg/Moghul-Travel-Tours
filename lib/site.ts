/**
 * Static site facts used by the shared layout.
 *
 * Real business details. PLACEHOLDERS still: office hours and the social
 * media links. In Module 6 (Manage Content Pages) these become defaults that
 * site_config rows override.
 */
export const SITE = {
  name: "Moghul Travel & Tours",
  legalName: "Moghul Travel & Tours Sdn Bhd",
  companyReg: "Co. Reg. No. 1273862-K",
  motacLicense: "MOTAC License No. KPK/LN 9109",
  addressLines: [
    "No. 6A (First Floor), Jalan Muara 8/9",
    "Seksyen 8, 40000 Shah Alam, Selangor",
  ],
  /** Office line — also the fax number. */
  phone: "03-5888 3401",
  mobile: "012-588 5590",
  /** International format, digits only, for tel: and wa.me links. */
  phoneIntl: "60358883401",
  mobileIntl: "60125885590",
  whatsappIntl: "60125885590",
  email: "info@moghultt.com",
  altEmail: "moghultt@gmail.com",
  officeHours: "Mon–Fri, 9am–6pm",
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
  // One menu entry covering both the UMRAH and ZIARAH package categories.
  { href: "/packages?category=umrah-ziarah", label: "Umrah & Ziarah" },
  { href: "/packages?category=group-tour", label: "Group Tours" },
  { href: "/packages?category=domestic", label: "Domestic" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;
