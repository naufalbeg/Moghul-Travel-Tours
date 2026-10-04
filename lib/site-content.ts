// Editable site content (Module 6), stored as key/value rows in site_config.
// Shared by server and client code — keep server-only imports out.

export const SITE_CONTENT_DEFAULTS = {
  // Texts in TRANSLATED_KEYS are in Malay (the site's main language); their
  // English versions are the matching "<key>_en" entries further down.
  //
  // Homepage banner. The headline is shown in capitals by CSS, so it's stored
  // as typed.
  hero_title: "Jelajah lebih jauh — temui percutian impian anda",
  hero_message:
    "Umrah, Ziarah dan percutian keluarga yang dirancang dengan teliti, disokong pengalaman lebih sedekad dan pasukan yang sentiasa mudah dihubungi.",
  about_summary:
    "Agensi pelancongan berlesen MOTAC di Shah Alam yang memberi tumpuan kepada Umrah, Ziarah dan percutian mesra keluarga — membawa rakyat Malaysia ke destinasi yang bermakna buat mereka selama lebih sedekad.",
  about_story: [
    "Moghul Travel & Tours Sdn Bhd ialah agensi pelancongan berlesen MOTAC yang berpangkalan di Shah Alam, Selangor. Selama lebih sedekad, kami telah membantu keluarga, jemaah dan kumpulan dari Malaysia melancong dengan yakin — daripada perjalanan Umrah dan Ziarah hingga lawatan berkumpulan ke luar negara dan percutian dalam negara.",
    "Kami memastikan setiap kumpulan diurus secara peribadi dan setiap rancangan praktikal: jadual yang selesa, rakan perkhidmatan yang dipercayai, dan pasukan yang mudah dihubungi sebelum, semasa dan selepas perjalanan anda.",
    "Sama ada Umrah pertama anda atau percutian bersama keluarga, berbincanglah dengan kami — kami akan bantu anda memilih perjalanan yang paling sesuai.",
  ].join("\n\n"),
  // Under the prices on every package page.
  price_note:
    "Harga termasuk tiket penerbangan. Oleh kerana tambang penerbangan sentiasa berubah, ini ialah harga permulaan — kami akan mengesahkan harga akhir apabila anda menghubungi kami.",
  office_hours: "Isnin–Jumaat, 9 pagi – 6 petang",

  hero_title_en: "Go beyond the ordinary — find your ideal journey",
  hero_message_en:
    "Umrah, Ziarah, and family tours planned with care, backed by over a decade of experience and a team you can actually reach.",
  about_summary_en:
    "A MOTAC licensed agency based in Shah Alam, focused on Umrah, Ziarah, and family-friendly tours — guiding Malaysian travellers to the places that matter to them for over a decade.",
  about_story_en: [
    "Moghul Travel & Tours Sdn Bhd is a MOTAC-licensed travel agency based in Shah Alam, Selangor. For over a decade we have helped Malaysian families, pilgrims and groups travel with confidence — from Umrah and Ziarah journeys to group tours abroad and holidays closer to home.",
    "We keep our groups personal and our plans practical: comfortable pacing, trusted partners, and a team you can reach before, during and after your trip.",
    "Whether it's your first Umrah or a family holiday, talk to us — we'll help you choose the journey that suits you.",
  ].join("\n\n"),
  price_note_en:
    "Prices include flights. Because airfares change, these are starting prices — we'll confirm your final price when you contact us.",
  office_hours_en: "Mon–Fri, 9am–6pm",

  address: "No. 6A (First Floor), Jalan Muara 8/9\nSeksyen 8, 40000 Shah Alam, Selangor",
  phone: "03-5888 3401",
  mobile: "012-588 5590",
  whatsapp: "012-588 5590",
  email: "info@moghultt.com",
  alt_email: "moghultt@gmail.com",
  motac_license: "KPK/LN 9109",
  company_reg: "1273862-K",
  matta_member: "",
  facebook_url: "",
  instagram_url: "",
  tiktok_url: "",
  // Where new-inquiry alerts go. Must be the Resend account's own address
  // until a sending domain is verified in Resend.
  inquiry_notify_email: "moghultt@gmail.com",
};

export type SiteContentKey = keyof typeof SITE_CONTENT_DEFAULTS;
export type SiteContent = Record<SiteContentKey, string>;
export const SITE_CONTENT_KEYS = Object.keys(SITE_CONTENT_DEFAULTS) as SiteContentKey[];

/** Texts with an English version stored under "<key>_en". */
export const TRANSLATED_KEYS = [
  "hero_title",
  "hero_message",
  "about_summary",
  "about_story",
  "price_note",
  "office_hours",
] as const satisfies readonly SiteContentKey[];

export type TranslatedKey = (typeof TRANSLATED_KEYS)[number];
export const englishKey = (key: TranslatedKey) => `${key}_en` as const satisfies SiteContentKey;

/**
 * Content as an English visitor sees it: each translated text replaced by
 * its English version, or kept in Malay when the English one is blank.
 */
export function localizeContent(content: SiteContent, locale: "ms" | "en"): SiteContent {
  if (locale === "ms") return content;
  const localized = { ...content };
  for (const key of TRANSLATED_KEYS) localized[key] = content[englishKey(key)].trim() || content[key];
  return localized;
}

/** Fields that may be left blank; everything else is required. */
export const OPTIONAL_CONTENT_KEYS: readonly SiteContentKey[] = [
  ...TRANSLATED_KEYS.map(englishKey),
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

/** Where "Inquire" buttons point: the inquiry form with the package pre-selected. */
export const inquireHref = (packageSlug: string) => `/inquire?package=${encodeURIComponent(packageSlug)}`;

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

/** Google Maps embed that needs no API key, labelled in the given language. */
export const mapEmbedUrl = (address: string, language = "ms") =>
  `https://maps.google.com/maps?q=${mapQuery(address)}&z=16&hl=${language}&output=embed`;

export const mapLinkUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${mapQuery(address)}`;
