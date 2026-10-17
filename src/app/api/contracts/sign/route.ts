import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// POST /api/contracts/sign
// Captures the customer's digital signature for a contract
// Requires: token, loanId, customerName, agreed (true)

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, loanId, customerName, agreed } = body;

  if (!token || !loanId || !customerName || !agreed) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!agreed) {
    return NextResponse.json({ error: "You must agree to the terms" }, { status: 400 });
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

  // Check expiry
  const expiresAt = new Date(data.signingExpiresAt);
  if (new Date() > expiresAt) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }

  // Check already signed
  if (data.signingStatus === "signed") {
    return NextResponse.json({ error: "Already signed" }, { status: 409 });
  }

  // Capture signature
  const signedAt = new Date().toISOString();
  const signatureData = {
    ...data,
    signingStatus: "signed",
    signedAt,
    signedBy: customerName,
    signatureMethod: "digital",
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  };

  await db
    .update(schema.loans)
    .set({
      pledgeTicketData: signatureData,
      status: "active", // Loan becomes active once contract is signed
      updatedAt: new Date(),
    })
    .where(eq(schema.loans.id, loan.id));

  return NextResponse.json({
    status: "signed",
    signedAt,
    signedBy: customerName,
    loanId,
    message: "Contract signed successfully. Your loan is now active.",
  });
}