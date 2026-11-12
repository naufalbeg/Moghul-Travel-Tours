// Browser security headers. The Content-Security-Policy is built per request
// in proxy.ts (it carries a one-time nonce); the fixed headers are applied to
// every response by next.config.ts.

const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
const HCAPTCHA = "https://hcaptcha.com https://*.hcaptcha.com";
const GOOGLE_MAPS = "https://maps.google.com https://www.google.com";

/**
 * What the pages are allowed to load, and from where. Anything not listed is
 * refused by the browser, so a script smuggled into admin- or visitor-typed
 * text could not run or phone home even if it got past React's escaping.
 *
 * - Scripts: only our own, marked with this request's nonce, and whatever
 *   those load ('strict-dynamic' — that is how the hCaptcha widget arrives).
 * - Styles: our stylesheets plus inline `style` attributes, which React and
 *   next/image use for positions and animation delays.
 * - Images: this site, Supabase Storage (package, gallery and banner
 *   photos), and in-browser previews (blob:/data:) for the admin's cropper.
 * - Connections: this site, Supabase (sign-in and photo uploads), hCaptcha.
 * - Frames: the hCaptcha check and the Google map on the Contact page.
 *
 * Adding a new outside service (analytics, a font host, a video embed) means
 * adding its address here, or the browser will block it.
 */
export function contentSecurityPolicy(nonce: string) {
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // React's dev tools need eval; production does not.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' ${HCAPTCHA}`,
    `img-src 'self' data: blob: ${SUPABASE}`,
    "font-src 'self' data:",
    `connect-src 'self' ${SUPABASE} ${HCAPTCHA}`,
    `frame-src ${HCAPTCHA} ${GOOGLE_MAPS}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** Headers that are the same for every response. */
export const SECURITY_HEADERS = [
  // Files are what their Content-Type says: no guessing an upload into a script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites learn only that a visitor came from here, not which page.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site can't be shown inside another site's frame (clickjacking). Older browsers' version of frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // The site uses none of these device features, so no page or embed may ask for them.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()" },
  // Browsers that have visited once always come back over HTTPS. Deliberately
  // without includeSubDomains: once the site is on moghultt.com, that would
  // also force HTTPS on mail., webmail. and the old host's control panel,
  // which this site does not control.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];
