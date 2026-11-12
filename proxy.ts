import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/security-headers";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Runs before every page:
 *
 * 1. Gives the page a Content-Security-Policy with a fresh one-time nonce
 *    (lib/security-headers.ts). Next.js reads the nonce from the request
 *    header and puts it on its own scripts, so only those can run.
 * 2. Under /admin: keeps the session fresh and bounces signed-out visitors
 *    to the login page. This is only an optimistic check — pages and server
 *    actions still enforce auth and roles themselves via lib/auth.ts.
 *
 * Public pages never carry a session, so they skip step 2 entirely.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = contentSecurityPolicy(nonce);
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", policy);

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    const response = NextResponse.next({ request });
    response.headers.set("Content-Security-Policy", policy);
    return response;
  }

  const { response, isSignedIn } = await updateSession(request);

  const isPublicAdminPage = ["/admin/login", "/admin/forgot-password", "/admin/set-password"].some((p) =>
    pathname.startsWith(p),
  );
  const isAdminPage = pathname.startsWith("/admin") && !isPublicAdminPage;

  if (isAdminPage && !isSignedIn) {
    const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
    // Carry over any cookie changes (e.g. a cleared expired session).
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  // Every page and server action, but not the built assets or image files.
  matcher: ["/((?!_next/static|_next/image|brand/|home/|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml)$).*)"],
};
