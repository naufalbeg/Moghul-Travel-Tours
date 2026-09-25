// Editable site content (Module 6), stored as key/value rows in site_config.
// Shared by server and client code — keep server-only imports out.

export const SITE_CONTENT_DEFAULTS = {
  about_summary:
    "A MOTAC licensed agency based in Shah Alam, focused on Umrah, Ziarah, and family-friendly tours — guiding Malaysian travellers to the places that matter to them for over a decade.",
  about_story: [
    "Moghul Travel & Tours Sdn Bhd is a MOTAC-licensed travel agency based in Shah Alam, Selangor. For over a decade we have helped Malaysian families, pilgrims and groups travel with confidence — from Umrah and Ziarah journeys to group tours abroad and holidays closer to home.",
    "We keep our groups personal and our plans practical: comfortable pacing, trusted partners, and a team you can reach before, during and after your trip.",
    "Whether it's your first Umrah or a family holiday, talk to us — we'll help you choose the journey that suits you.",
  ].join("\n\n"),
  address: "No. 6A (First Floor), Jalan Muara 8/9\nSeksyen 8, 40000 Shah Alam, Selangor",
  phone: "03-5888 3401",
  mobile: "012-588 5590",
  whatsapp: "012-588 5590",
  email: "info@moghultt.com",
  alt_email: "moghultt@gmail.com",
  office_hours: "Mon–Fri, 9am–6pm",
  motac_license: "KPK/LN 9109",
  company_reg: "1273862-K",
  matta_member: "",
  facebook_url: "",
  instagram_url: "",
  tiktok_url: "",
};

export type SiteContentKey = keyof typeof SITE_CONTENT_DEFAULTS;
export type SiteContent = Record<SiteContentKey, string>;
export const SITE_CONTENT_KEYS = Object.keys(SITE_CONTENT_DEFAULTS) as SiteContentKey[];

/** Fields that may be left blank; everything else is required. */
export const OPTIONAL_CONTENT_KEYS: readonly SiteContentKey[] = [
  "mobile",
  "alt_email",
  "matta_member",
  "facebook_url",
  "instagram_url",
  "tiktok_url",
];

/** "03-5888 3401" / "+(60)3 5888 3401" → "60358883401" for tel: and wa.me links. */
export function toIntlPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("60")) return digits;
  if (digits.startsWith("0")) return `6${digits}`;
  return digits;
}

export const telHref = (phone: string) => `tel:+${toIntlPhone(phone)}`;

export function whatsappHref(content: Pick<SiteContent, "whatsapp">, text?: string) {
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${toIntlPhone(content.whatsapp)}${query}`;
}

/**
 * Where "Inquire" buttons point. Until the inquiry form (Module 3) exists,
 * this opens WhatsApp with the package name filled in.
 */
export function inquireHref(content: Pick<SiteContent, "whatsapp">, packageTitle: string) {
  return whatsappHref(content, `Hi Moghul Travel & Tours, I'd like to ask about the "${packageTitle}" package.`);
}

/** Non-empty lines of a multi-line field (address, office hours). */
export const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** Paragraphs separated by blank lines. */
export const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const mapQuery = (address: string) => encodeURIComponent(lines(address).join(", "));

/** Google Maps embed that needs no API key. */
export const mapEmbedUrl = (address: string) => `https://maps.google.com/maps?q=${mapQuery(address)}&z=16&output=embed`;

export const mapLinkUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${mapQuery(address)}`;
