import "server-only";

/**
 * HCaptcha middleware (SDD PKG-MTT-010-004): verifies a widget token with
 * hCaptcha. Tokens are single-use, so call this once per submission.
 */
export async function verifyCaptcha(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  if (!secret || !sitekey) {
    console.error("hCaptcha keys are not configured");
    return false;
  }
  if (!token) return false;

  try {
    const res = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, sitekey }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) console.warn("hCaptcha rejected a token", data["error-codes"]);
    return data.success === true;
  } catch (error) {
    console.error("hCaptcha verification failed", error);
    return false;
  }
}
