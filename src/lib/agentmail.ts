import "server-only";

const AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY || "";
const AGENTMAIL_INBOX = process.env.AGENTMAIL_INBOX || "pawnpass@agentmail.to";
const BASE_URL = "https://api.agentmail.to/v0";

export const IS_AGENTMAIL_CONFIGURED = !!AGENTMAIL_API_KEY;

interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

interface AgentMailMessage {
  message_id: string;
  thread_id: string;
}

/**
 * Send an email via AgentMail API
 */
export async function sendEmail(params: SendEmailParams): Promise<AgentMailMessage | null> {
  if (!IS_AGENTMAIL_CONFIGURED) {
    console.log("[agentmail] Not configured — skipping send to", params.to);
    return null;
  }

  const to = Array.isArray(params.to) ? params.to : [params.to];

  try {
    const res = await fetch(`${BASE_URL}/inboxes/${AGENTMAIL_INBOX}/messages/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AGENTMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject: params.subject,
        text: params.text || "",
        html: params.html || params.text || "",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[agentmail] Send failed:", res.status, err);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("[agentmail] Send error:", err);
    return null;
  }
}

/**
 * List messages in the inbox
 */
export async function listMessages(limit: number = 20): Promise<any[]> {
  if (!IS_AGENTMAIL_CONFIGURED) return [];

  try {
    const res = await fetch(
      `${BASE_URL}/inboxes/${AGENTMAIL_INBOX}/messages?limit=${limit}`,
      { headers: { Authorization: `Bearer ${AGENTMAIL_API_KEY}` } }
    );

    if (!res.ok) {
      console.error("[agentmail] List failed:", res.status);
      return [];
    }

    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.error("[agentmail] List error:", err);
    return [];
  }
}

/**
 * Read a specific message by ID
 */
export async function readMessage(messageId: string): Promise<any | null> {
  if (!IS_AGENTMAIL_CONFIGURED) return null;

  try {
    const res = await fetch(
      `${BASE_URL}/inboxes/${AGENTMAIL_INBOX}/messages/${messageId}`,
      { headers: { Authorization: `Bearer ${AGENTMAIL_API_KEY}` } }
    );

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[agentmail] Read error:", err);
    return null;
  }
}

/**
 * Send a customer welcome email (replaces Gmail-based sendWelcomeEmail)
 */
export async function sendCustomerWelcome(toEmail: string, name: string | null): Promise<boolean> {
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

  const result = await sendEmail({
    to: toEmail,
    subject: "You're on the list — PawnPass is coming",
    text: `Hi ${firstName},\n\nThanks for joining the PawnPass launch list. You're now on the priority list — you'll be the first to know when we go live.\n\nWhat's coming:\n• AI-powered instant pawn quotes\n• 24/7 parcel locker drop-off\n• Osko instant payment to your bank\n• No storefront, no judgement, no stigma\n\nWe'll only email you when PawnPass is live — no spam, no noise.\n\n© 2026 Pawn Pass · ACL: Theorify · AUSTRAC registered\n311 NE Road, Hampstead Gardens SA 5086`,
    html,
  });

  return !!result;
}

/**
 * Send an admin alert email (also BCCs Adam's Gmail)
 */
export async function sendAdminAlertEmail(signupEmail: string, name: string | null, totalSignups: number): Promise<boolean> {
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

  const textBody = `New PawnPass Signup\n\nEmail: ${signupEmail}\nName: ${name || "—"}\nTotal signups: ${totalSignups}\nTime: ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Adelaide" })}\n\nView admin dashboard: https://www.pawnpass.com.au/admin`;

  // Send to Adam's Gmail directly
  const result = await sendEmail({
    to: "amenadue73@gmail.com",
    subject: `PawnPass: New signup — ${signupEmail} (${totalSignups} total)`,
    html,
    text: textBody,
  });

  return !!result;
}

/**
 * Send a contract signing link to a customer
 */
export async function sendContractSigningLink(
  toEmail: string,
  customerName: string | null,
  signingUrl: string,
  loanId: string,
  contractType: "pawn" | "buy" = "pawn"
): Promise<boolean> {
  const firstName = customerName ? customerName.split(" ")[0] : "there";
  const contractLabel = contractType === "pawn" ? "Pawn Loan Agreement" : "Buy Outright Agreement";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #0A0A0A; padding: 40px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #FF6B00; border-radius: 12px; line-height: 48px; font-size: 24px; font-weight: bold; color: #fff;">P</div>
        <h1 style="color: #fff; font-size: 24px; margin: 16px 0 4px;">Pawn<span style="color: #FF6B00;">Pass</span></h1>
        <p style="color: #666; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Digital Pawnbroker</p>
      </div>

      <p style="color: #ccc; font-size: 15px; line-height: 1.6;">Hi ${firstName},</p>

      <p style="color: #ccc; font-size: 15px; line-height: 1.6;">
        Your ${contractLabel} is ready to sign. Please review and sign your agreement using the link below:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${signingUrl}" style="display: inline-block; background: #FF6B00; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 0 20px rgba(255,107,0,0.3);">
          Review & Sign Agreement →
        </a>
      </div>

      <p style="color: #999; font-size: 13px; line-height: 1.5;">
        Loan reference: <span style="font-family: monospace; color: #ccc;">${loanId}</span><br>
        This link expires in 48 hours.
      </p>

      <p style="color: #666; font-size: 13px; line-height: 1.5; margin-top: 24px;">
        If you did not request this, please ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
      <p style="color: #444; font-size: 11px; text-align: center;">
        © 2026 Pawn Pass · ACL: Theorify · AUSTRAC registered<br>
        311 NE Road, Hampstead Gardens SA 5086
      </p>
    </div>
  `;

  const result = await sendEmail({
    to: toEmail,
    subject: `PawnPass: Sign your ${contractLabel} — ${loanId}`,
    text: `Hi ${firstName},\n\nYour ${contractLabel} is ready to sign.\n\nLoan reference: ${loanId}\n\nSign here: ${signingUrl}\n\nThis link expires in 48 hours.\n\nIf you did not request this, please ignore this email.\n\n© 2026 Pawn Pass · ACL: Theorify · AUSTRAC registered\n311 NE Road, Hampstead Gardens SA 5086`,
    html,
  });

  return !!result;
}
