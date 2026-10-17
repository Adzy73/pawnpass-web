import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { eq } from "drizzle-orm";

// POST /api/payments/create-intent
// Creates a Stripe PaymentIntent for loan interest or redemption payment
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { loanId, amount, type } = body; // type: "interest" | "redemption"

  if (!loanId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid loan ID or amount" }, { status: 400 });
  }

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

  // ── MOCK MODE ──────────────────────────────────────────────────────
  if (!stripe) {
    await db.insert(schema.payments).values({
      loanId: loan.id,
      userId,
      amount: amount.toFixed(2),
      type: type || "interest",
      reference: `mock_${Date.now()}`,
    });

    if (type === "redemption") {
      await db
        .update(schema.loans)
        .set({ status: "redeemed", updatedAt: new Date() })
        .where(eq(schema.loans.id, loan.id));
    } else {
      const newTotal = (parseFloat(loan.totalInterestPaid || "0") + amount).toFixed(2);
      await db
        .update(schema.loans)
        .set({
          totalInterestPaid: newTotal,
          interestPaidThrough: new Date(),
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(schema.loans.id, loan.id));
    }

    return NextResponse.json({
      mode: "mock",
      clientSecret: "mock_client_secret",
      status: "succeeded",
      message: "Payment processed in mock mode",
    });
  }

  // ── STRIPE MODE ────────────────────────────────────────────────────
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: "aud",
      metadata: {
        loanId,
        userId,
        type: type || "interest",
      },
      description: type === "redemption"
        ? `PawnPass loan redemption — ${loanId}`
        : `PawnPass loan interest payment — ${loanId}`,
    });

    return NextResponse.json({
      mode: "stripe",
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: "pending",
    });
  } catch (error) {
    console.error("Stripe payment error:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
