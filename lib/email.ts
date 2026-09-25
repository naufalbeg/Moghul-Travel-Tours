import "server-only";
import { Resend } from "resend";
import { SITE } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";

/**
 * ResendEmail middleware (SDD PKG-MTT-010-003).
 *
 * Until moghultt.com is verified in Resend, mail can only be sent from
 * onboarding@resend.dev to the Resend account's own address. Set EMAIL_FROM
 * (e.g. "Moghul Travel & Tours <noreply@moghultt.com>") once the domain is
 * verified.
 */
const FROM = process.env.EMAIL_FROM || `${SITE.name} <onboarding@resend.dev>`;


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

/** Sends one email; returns false (and logs) instead of throwing. */
async function send(message: { to: string; subject: string; html: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — email skipped:", message.subject);
    return false;
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({ from: FROM, ...message });
    if (error) {
      console.error("Resend rejected an email", message.subject, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email failed", message.subject, error);
    return false;
  }
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="background:#f07c1e;color:#fff;padding:13px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${label}</a></p>`;

const wrap = (body: string) =>
  `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#1a2733;max-width:560px">${body}</div>`;

/** sendInvitationEmail — REQ-MTT-001-004: one-time setup link, valid 24 hours. */
export function sendInvitationEmail(to: string, name: string, invitedBy: string, link: string) {
  return send({
    to,
    subject: `You're invited to the ${SITE.name} admin dashboard`,
    html: wrap(`
      <h2 style="color:#123a66;margin:0 0 12px">Hi ${escape(name)},</h2>
      <p>${escape(invitedBy)} has invited you to help manage the ${SITE.name} website.</p>
      <p>Click the button below to choose your password and sign in.</p>
      ${button(link, "Set up my account")}
      <p style="color:#5b6b7a;font-size:13px">This link works once and expires in 24 hours. If it has expired, ask ${escape(invitedBy)} to send a new invitation.</p>`),
    text: `Hi ${name},\n\n${invitedBy} has invited you to help manage the ${SITE.name} website.\n\nSet up your account (link expires in 24 hours):\n${link}`,
  });
}

/** Password reset link, valid 1 hour. */
export function sendPasswordResetEmail(to: string, name: string, link: string) {
  return send({
    to,
    subject: `Reset your ${SITE.name} admin password`,
    html: wrap(`
      <h2 style="color:#123a66;margin:0 0 12px">Hi ${escape(name)},</h2>
      <p>We received a request to reset the password for your admin account.</p>
      ${button(link, "Choose a new password")}
      <p style="color:#5b6b7a;font-size:13px">This link works once and expires in 1 hour. If you didn't ask for this, you can ignore this email — your password won't change.</p>`),
    text: `Hi ${name},\n\nReset your admin password (link expires in 1 hour):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
  });
}
