import { z } from "zod";

// The site's Content-Security-Policy forbids eval (lib/security-headers.ts).
// Zod's fast path builds its parsers with `new Function`, and even its check
// for whether that is allowed gets reported by the browser as a blocked
// script. "jitless" turns the fast path off; the forms here are far too small
// for the difference to be felt. Imported for its side effect by every file
// in this folder, so it runs before any schema is used in the browser.
z.config({ jitless: true });
