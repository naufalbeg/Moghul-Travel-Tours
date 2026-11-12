import { SITE } from "@/lib/site";
import { lines, toIntlPhone, type SiteContent } from "@/lib/site-content";
import { siteUrl } from "@/lib/site-url";

// schema.org descriptions of the agency and its packages, for search engines
// (rendered with <JsonLd>). Only facts already shown on the page go in here.

/** The agency: name, address, phone and email as set in Content pages. */
export function travelAgencyJsonLd(content: SiteContent) {
  const base = siteUrl();
  const address = lines(content.address);
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: SITE.name,
    legalName: SITE.legalName,
    url: base,
    logo: `${base}/brand/moghul-logo.png`,
    image: `${base}/opengraph-image.png`,
    telephone: `+${toIntlPhone(content.phone)}`,
    email: content.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: address.slice(0, -1).join(", ") || address[0],
      addressLocality: "Shah Alam",
      addressRegion: "Selangor",
      addressCountry: "MY",
    },
    sameAs: [content.facebook_url, content.instagram_url, content.tiktok_url].filter(Boolean),
  };
}

/** One package: what it is, its photo and its "starts from" price. */
export function packageJsonLd(pkg: {
  slug: string;
  title: string;
  description: string;
  imageUrls: string[];
  fromPrice: number | null;
  soldOut: boolean;
}) {
  const url = `${siteUrl()}/packages/${pkg.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.title,
    description: pkg.description.slice(0, 500),
    image: pkg.imageUrls.slice(0, 4),
    url,
    brand: { "@type": "Organization", name: SITE.name },
    ...(pkg.fromPrice !== null && {
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "MYR",
        price: pkg.fromPrice,
        availability: pkg.soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        seller: { "@type": "TravelAgency", name: SITE.name },
      },
    }),
  };
}

/** The trail shown at the top of a page, e.g. Utama / Pakej / <package>. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}
