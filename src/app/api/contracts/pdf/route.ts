import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/contracts/pdf?loan=PP-LOAN-101
// Serves a standalone, beautifully formatted printable HTML/PDF document of the official PawnPass Pledge Ticket.

export async function GET(request: NextRequest) {
  const loanId = request.nextUrl.searchParams.get("loan");

  if (!loanId) {
    return new NextResponse("Missing loan ID", { status: 400 });
  }

  const [loan] = await db
    .select()
    .from(schema.loans)
    .where(eq(schema.loans.loanId, loanId));

  if (!loan) {
    return new NextResponse("Loan not found", { status: 404 });
  }

  const ticketData = (loan.pledgeTicketData as any) || {};
  const customerName = ticketData.signedBy || ticketData.borrowerName || "Customer";
  const signedAt = ticketData.signedAt
    ? new Date(ticketData.signedAt).toLocaleString("en-AU", { timeZone: "Australia/Adelaide" })
    : new Date().toLocaleString("en-AU", { timeZone: "Australia/Adelaide" });

  const html = `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <title>PawnPass Official Pledge Ticket — ${loan.loanId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0A0A0A; color: #fff; padding: 40px 20px; margin: 0; }
    .ticket-card { background: #141414; border: 2px solid #FF6B00; border-radius: 16px; padding: 36px; max-width: 720px; margin: 0 auto; box-shadow: 0 0 40px rgba(255,107,0,0.2); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 20px; margin-bottom: 24px; }
    .logo-row { display: flex; align-items: center; gap: 12px; }
    .title { font-size: 22px; font-weight: bold; color: #ffffff; }
    .subtitle { font-size: 11px; color: #888; font-family: monospace; margin-top: 2px; }
    .badge { background: rgba(0, 168, 126, 0.15); border: 1px solid #00A87E; color: #00A87E; padding: 14px; border-radius: 12px; font-size: 13px; font-weight: 600; margin-bottom: 24px; text-align: center; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 24px; }
    .label { font-size: 10px; color: #888; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; }
    .val { font-size: 15px; font-weight: bold; color: #fff; margin-top: 4px; }
    .orange { color: #FF6B00; }
    .terms-box { border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; font-size: 12px; color: #ccc; line-height: 1.6; margin-bottom: 28px; background: rgba(0,0,0,0.4); }
    .terms-box ul { margin: 8px 0 0 0; padding-left: 20px; }
    .sig-section { border-top: 1px solid rgba(255,255,255,0.15); pt: 20px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; }
    .sig-img { height: 60px; border: 1px solid rgba(255,255,255,0.2); padding: 4px; border-radius: 6px; background: #000; margin-top: 8px; }
    .btn-bar { text-align: center; margin-bottom: 24px; }
    .print-btn { background: #FF6B00; color: white; border: none; padding: 14px 28px; border-radius: 30px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 0 20px rgba(255,107,0,0.4); transition: transform 0.2s; }
    .print-btn:hover { transform: scale(1.03); }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .ticket-card { background: #fff; color: #000; border: 2px solid #000; box-shadow: none; max-width: 100%; }
      .title, .val { color: #000 !important; }
      .label, .subtitle { color: #555 !important; }
      .terms-box { border: 1px solid #ccc; color: #111; background: #f9f9f9; }
      .grid { background: #f5f5f5; border: 1px solid #ddd; }
      .badge { background: #f0fff0; border: 1px solid #00a87e; color: #006644; }
      .btn-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="btn-bar">
    <button class="print-btn" onclick="window.print()">🖨 Click Here to Print / Save as PDF</button>
  </div>

  <div class="ticket-card">
    <div class="header">
      <div class="logo-row">
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
          <path d="M50 5 L90 25 V65 L50 95 L10 65 V25 Z" fill="#FF6B00"/>
          <text x="50" y="65" font-size="45" font-weight="bold" fill="#0A0A0A" text-anchor="middle">P</text>
        </svg>
        <div>
          <div class="title">PawnPass Official Pledge Ticket</div>
          <div class="subtitle">Second-hand Dealers and Pawnbrokers Act 1996 (SA) · Reg 11</div>
        </div>
      </div>
    </div>

    <div class="badge">
      ✅ Contract Digitally Signed &amp; Active — Signed by ${customerName} on ${signedAt}
    </div>

    <div class="grid">
      <div><div class="label">LOAN / TICKET ID</div><div class="val orange">${loan.loanId}</div></div>
      <div><div class="label">PLEDGOR (CUSTOMER)</div><div class="val">${customerName}</div></div>
      <div><div class="label">COLLATERAL ITEM</div><div class="val">${loan.itemDescription}</div></div>
      <div><div class="label">PRINCIPAL OFFER</div><div class="val">$${loan.principal}</div></div>
      <div><div class="label">MONTHLY INTEREST RATE</div><div class="val orange">${loan.interestRate}/month</div></div>
      <div><div class="label">HUB LOCKER RECEIVER</div><div class="val" style="font-size: 13px;">Parcel Locker 51 (APCN 1000146016) GREENACRES SA 5086</div></div>
    </div>

    <div class="terms-box">
      <strong>Statutory Pledge Terms &amp; Conditions (SA Act 1996):</strong>
      <ul>
        <li><strong>Redemption Period:</strong> 90 days from agreement date. Redeemable anytime by paying principal + accrued interest.</li>
        <li><strong>Auto-Pay Interest:</strong> Monthly interest payment extends redemption by 30 days.</li>
        <li><strong>Unredeemed Goods &amp; Residual Equity:</strong> If forfeited, PawnPass sells the item under SA Section 14(3) for best price reasonably obtainable. Any surplus residual equity (RE = Sale Price − (Principal + Interest + COS)) is returned to borrower.</li>
      </ul>
    </div>

    <div class="sig-section">
      <div>
        <div class="label">DIGITAL SIGNATURE</div>
        ${
          ticketData.signatureImage
            ? `<img src="${ticketData.signatureImage}" class="sig-img"/>`
            : `<div style="font-serif: italic; font-size: 20px; border-bottom: 1px solid #888; width: 220px; margin-top: 8px;">/s/ ${customerName}</div>`
        }
        <div style="font-size: 11px; color: #888; margin-top: 6px;">Signatory: ${customerName}</div>
      </div>

      <div style="text-align: right; font-size: 11px; color: #888; font-family: monospace;">
        <div>Pawnbroker: PawnPass Pty Ltd</div>
        <div>ACL: Theorify · AUSTRAC Registered</div>
        <div>311 NE Road Hampstead Gardens SA 5086</div>
        <div>IP: ${ticketData.ipAddress || "Verified Digital Signature"}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="PawnPass-PledgeTicket-${loan.loanId}.html"`,
    },
  });
}