import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// POST /api/contracts/create-signing-link
// Generates a secure, time-limited signing link for a loan or buy-outright transaction
// Returns: { link, token, expiresAt, channel }

const SIGNING_TOKEN_TTL_HOURS = 48;

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { loanId, type, channels } = body; // type: "pawn" | "buy", channels: ["email", "sms"]

  if (!loanId || !type) {
    return NextResponse.json({ error: "Missing loanId or type" }, { status: 400 });
  }

  // Verify the loan belongs to this user
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

  // Generate secure signing token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SIGNING_TOKEN_TTL_HOURS);

  // Build signing URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3002";
  const signingLink = `${baseUrl}/sign?token=${token}&type=${type}&loan=${loanId}`;

  // Store the token in the loan's metadata (we'll use pledgeTicketData for now)
  // In production this would be a dedicated signing_tokens table
  const signingData = {
    signingToken: token,
    signingType: type,
    signingExpiresAt: expiresAt.toISOString(),
    signingStatus: "pending",
  };

  const existingData = (loan.pledgeTicketData as any) || {};
  await db
    .update(schema.loans)
    .set({
      pledgeTicketData: { ...existingData, ...signingData },
      updatedAt: new Date(),
    })
    .where(eq(schema.loans.id, loan.id));

  return NextResponse.json({
    link: signingLink,
    token,
    expiresAt: expiresAt.toISOString(),
    channels: channels || ["email", "sms"],
    loanId,
    type,
  });
}

// GET /api/contracts/verify-token?token=xxx
// Verifies a signing token is valid and not expired
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const loanId = request.nextUrl.searchParams.get("loan");

  if (!token || !loanId) {
    return NextResponse.json({ error: "Missing token or loan ID" }, { status: 400 });
  }

  const [loan] = await db
    .select()
    .from(schema.loans)
    .where(eq(schema.loans.loanId, loanId));

  if (!loan) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const data = loan.pledgeTicketData as any;
  if (!data || data.signingToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const expiresAt = new Date(data.signingExpiresAt);
  if (new Date() > expiresAt) {
    return NextResponse.json({ error: "Link expired", expired: true }, { status: 410 });
  }

  if (data.signingStatus === "signed") {
    return NextResponse.json({ error: "Already signed", signed: true }, { status: 409 });
  }

  return NextResponse.json({
    valid: true,
    loanId: loan.loanId,
    type: data.signingType,
    itemDescription: loan.itemDescription,
    principal: loan.principal,
    interestRate: loan.interestRate,
    isGold: loan.isGold,
    dueDate: loan.dueDate,
    status: data.signingStatus || "pending",
    expiresAt: data.signingExpiresAt,
  });
}