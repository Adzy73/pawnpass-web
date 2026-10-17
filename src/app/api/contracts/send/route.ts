import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { eq } from "drizzle-orm";
import { sendContractSigningLink, IS_AGENTMAIL_CONFIGURED } from "@/lib/agentmail";

// POST /api/contracts/send
// Dispatches contract signing links via email and/or SMS (AgentMail)
// Body: { loanId, type, channels: ["email", "sms"] }

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { loanId, type, channels } = body;

  if (!loanId || !type || !channels) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify loan
  const [loan] = await db
    .select()
    .from(schema.loans)
    .where(eq(schema.loans.loanId, loanId));

  if (!loan) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  if (loan.userId !== userId) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  // Get user details
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate signing link via internal API call
  const baseUrl = request.nextUrl.origin;
  const signingRes = await fetch(`${baseUrl}/api/contracts/create-signing-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") || "" },
    body: JSON.stringify({ loanId, type, channels }),
  });

  if (!signingRes.ok) {
    return NextResponse.json({ error: "Failed to generate signing link" }, { status: 500 });
  }

  const signingData = await signingRes.json();
  const signingLink = signingData.link;

  const results: string[] = [];

  // Send via email (AgentMail)
  if (channels.includes("email") && user.email) {
    const sent = await sendContractSigningLink(
      user.email,
      user.name,
      signingLink,
      loanId,
      type === "pawn" ? "pawn" : "buy"
    );
    if (sent) {
      results.push(`email:${user.email}`);
    } else {
      results.push("email:failed");
    }
  }

  // Send via SMS (still TODO — needs SMS gateway)
  if (channels.includes("sms") && user.phone) {
    console.log(`[SMS] To: ${user.phone} | Signing link: ${signingLink}`);
    results.push(`sms:logged:${user.phone}`);
  }

  return NextResponse.json({
    sent: true,
    channels: results,
    signingLink,
    expiresAt: signingData.expiresAt,
    message: `Signing link sent via ${results.join(", ")}`,
  });
}