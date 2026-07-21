import "server-only";
import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendWelcomeEmail(toEmail: string, name: string | null) {
  const t = getTransporter();
  if (!t) {
    console.log("[email] GMAIL creds not configured — skipping welcome email to", toEmail);
    return false;
  }

  const firstName = name ? name.split(" ")[0] : "there";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #0A0A0A; padding: 40px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #FF6B00; border-radius: 12px; line-height: 48px; font-size: 24px; font-weight: bold; color: #fff;">P</div>
        <h1 style="color: #fff; font-size: 24px; margin: 16px 0 4px;">Pawn<span style="color: #FF6B00;">Pass</span></h1>
        <p style="color: #666; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Digital Pawnbroker</p>
      </div>

      <p style="color: #ccc; font-size: 15px; line-height: 1.6;">Hi ${firstName},</p>

      <p style="color: #ccc; font-size: 15px; line-height: 1.6;">
        Thanks for joining the PawnPass launch list. You're now on the priority list —
        you'll be the first to know when we go live.
      </p>

      <div style="background: rgba(255,107,0,0.08); border: 1px solid rgba(255,107,0,0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="color: #FF6B00; font-size: 12px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">What's coming</p>
        <p style="color: #999; font-size: 14px; margin: 0; line-height: 1.5;">
          • AI-powered instant pawn quotes<br>
          • 24/7 parcel locker drop-off<br>
          • Osko instant payment to your bank<br>
          • No storefront, no judgement, no stigma
        </p>
      </div>

      <p style="color: #666; font-size: 13px; line-height: 1.5; margin-top: 32px;">
        We'll only email you when PawnPass is live — no spam, no noise.
      </p>

      <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
      <p style="color: #444; font-size: 11px; text-align: center;">
        © 2026 Pawn Pass · ACL: Theorify · AUSTRAC registered<br>
        311 NE Road, Hampstead Gardens SA 5086
      </p>
    </div>
  `;

  try {
    await t.sendMail({
      from: `"PawnPass" <${GMAIL_USER}>`,
      to: toEmail,
      subject: "You're on the list — PawnPass is coming",
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send welcome:", err);
    return false;
  }
}

export async function sendAdminAlert(signupEmail: string, name: string | null, totalSignups: number) {
  const t = getTransporter();
  if (!t) return false;

  const html = `
    <div style="font-family: monospace; max-width: 500px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #FF6B00;">New PawnPass Signup</h2>
      <table style="font-size: 14px; color: #333;">
        <tr><td style="padding: 4px 12px 4px 0; color: #888;">Email:</td><td><strong>${signupEmail}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #888;">Name:</td><td>${name || "—"}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #888;">Total signups:</td><td><strong>${totalSignups}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #888;">Time:</td><td>${new Date().toLocaleString("en-AU", { timeZone: "Australia/Adelaide" })}</td></tr>
      </table>
      <p style="margin-top: 24px;"><a href="https://www.pawnpass.com.au/admin" style="color: #FF6B00;">View admin dashboard →</a></p>
    </div>
  `;

  try {
    await t.sendMail({
      from: `"PawnPass" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject: `PawnPass: New signup — ${signupEmail} (${totalSignups} total)`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send admin alert:", err);
    return false;
  }
}
