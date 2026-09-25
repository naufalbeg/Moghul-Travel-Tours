import "server-only";
import { Resend } from "resend";
import { SITE } from "@/lib/site";

/**
 * ResendEmail middleware (SDD PKG-MTT-010-003).
 *
 * Until moghultt.com is verified in Resend, mail can only be sent from
 * onboarding@resend.dev to the Resend account's own address. Set EMAIL_FROM
 * (e.g. "Moghul Travel & Tours <noreply@moghultt.com>") once the domain is
 * verified.
 */
const FROM = process.env.EMAIL_FROM || `${SITE.name} <onboarding@resend.dev>`;

/** Absolute site URL for links in emails. */
export function siteUrl() {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type InquiryEmail = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  packageInterest: string | null;
  message: string;
};

/**
 * sendInquiryNotification — REQ-MTT-003-005. Returns false instead of
 * throwing: a failed email must never block the inquiry (SRS E2).
 */
export async function sendInquiryNotification(to: string, inquiry: InquiryEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — inquiry email skipped");
    return false;
  }

  const pkg = inquiry.packageInterest ?? "General inquiry";
  const adminLink = `${siteUrl()}/admin/inquiries/${inquiry.id}`;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#5b6b7a;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:6px 0;color:#1a2733">${value}</td></tr>`;

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1a2733;max-width:560px">
      <h2 style="color:#123a66;margin:0 0 12px">New inquiry from the website</h2>
      <table style="border-collapse:collapse">
        ${row("Name", escape(inquiry.fullName))}
        ${row("Phone", escape(inquiry.phone))}
        ${row("Email", `<a href="mailto:${escape(inquiry.email)}">${escape(inquiry.email)}</a>`)}
        ${row("Package", escape(pkg))}
        ${row("Message", inquiry.message ? escape(inquiry.message).replace(/\n/g, "<br>") : "<em>No message</em>")}
      </table>
      <p style="margin:20px 0">
        <a href="${adminLink}" style="background:#f07c1e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Open in the admin dashboard</a>
      </p>
      <p style="color:#5b6b7a;font-size:13px">Reply to this email to answer ${escape(inquiry.fullName)} directly.</p>
    </div>`;

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: FROM,
      to,
      replyTo: inquiry.email,
      subject: `New inquiry: ${inquiry.fullName} — ${pkg}`,
      html,
      text: [
        `New inquiry from the website`,
        `Name: ${inquiry.fullName}`,
        `Phone: ${inquiry.phone}`,
        `Email: ${inquiry.email}`,
        `Package: ${pkg}`,
        `Message: ${inquiry.message || "(none)"}`,
        ``,
        `Open in the admin dashboard: ${adminLink}`,
      ].join("\n"),
    });
    if (error) {
      console.error("Resend rejected the inquiry email", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Inquiry email failed", error);
    return false;
  }
}
