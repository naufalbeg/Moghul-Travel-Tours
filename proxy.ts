import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Keeps admin sessions fresh and bounces signed-out visitors to the login page.
// This is only an optimistic check — pages and API routes still enforce auth
// and roles themselves via lib/auth.ts.
export async function proxy(request: NextRequest) {
  const { response, isSignedIn } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  if (isAdminPage && !isSignedIn) {
    const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
    // Carry over any cookie changes (e.g. a cleared expired session).
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  // Public pages never carry a session, so skip them entirely.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
