"use server";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "CIT-U Liquidation System <noreply@cit.edu>";
const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  if (resend) {
    await resend.emails.send({ from: FROM, to, subject, html });
  } else {
    // Dev stub: log the email body so you can copy the link from the console.
    console.log("\n──────────────────────────────────────────");
    console.log(`[EMAIL STUB] To: ${to}`);
    console.log(`[EMAIL STUB] Subject: ${subject}`);
    console.log(html.replace(/<[^>]+>/g, ""));
    console.log("──────────────────────────────────────────\n");
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${BASE_URL}/verify-email?token=${token}`;
  await send(
    to,
    "Verify your CIT-U Liquidation System email",
    `<p>Click the link below to verify your email address. This link expires in 24 hours.</p>
     <p><a href="${url}">${url}</a></p>
     <p>If you did not sign up, you can ignore this email.</p>`,
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${BASE_URL}/reset-password?token=${token}`;
  await send(
    to,
    "Reset your CIT-U Liquidation System password",
    `<p>Click the link below to reset your password. This link expires in 1 hour.</p>
     <p><a href="${url}">${url}</a></p>
     <p>If you did not request a password reset, you can ignore this email.</p>`,
  );
}
