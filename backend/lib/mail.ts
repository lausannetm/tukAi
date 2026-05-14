import { existsSync } from "node:fs";
import nodemailer from "nodemailer";

/** MailHog service name only resolves inside Docker; on the host use loopback. */
function resolvedSmtpHost(): string {
  const raw = process.env.SMTP_HOST?.trim();
  if (raw === "mailhog") {
    const inContainer = existsSync("/.dockerenv");
    return inContainer ? "mailhog" : "127.0.0.1";
  }
  return raw && raw.length > 0 ? raw : "127.0.0.1";
}

function smtpPort(): number {
  const raw = process.env.SMTP_PORT?.trim() || "1025";
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1025;
}

function smtpFrom(): string {
  return process.env.SMTP_FROM?.trim() || "noreply@localhost";
}

function frontendOrigin(): string {
  return (
    process.env.FRONTEND_PUBLIC_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function sendRegistrationConfirmationEmail(params: {
  to: string;
  plainToken: string;
  displayName: string | null;
}): Promise<void> {
  const confirmUrl = `${frontendOrigin()}/confirm-email?token=${encodeURIComponent(params.plainToken)}`;
  const name = params.displayName?.trim() || "there";

  const transport = nodemailer.createTransport({
    host: resolvedSmtpHost(),
    port: smtpPort(),
    secure: false,
  });
  try {
    await transport.sendMail({
      from: smtpFrom(),
      to: params.to,
      subject: "Confirm your email",
      text: `Hi ${name},\n\nPlease confirm your email by opening this link:\n${confirmUrl}\n\nIf you did not create an account, you can ignore this message.\n`,
      html: `<p>Hi ${escapeHtml(name)},</p><p>Please confirm your email by clicking:</p><p><a href="${encodeURI(confirmUrl)}">Confirm email</a></p><p>If you did not create an account, you can ignore this message.</p>`,
    });
  } finally {
    transport.close();
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
