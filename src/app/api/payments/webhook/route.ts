import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// POST /api/payments/webhook
// Receives Stripe webhook events for payment confirmations
// IDEMPOTENT: checks if a payment with the same Stripe PaymentIntent ID already exists
// before processing. Stripe retries webhooks — without idempotency, a retried event
// would double-credit interest or double-redeem a loan.
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  // If no webhook secret is configured, reject — never process unsigned webhooks
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured — rejecting webhook");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig || "", webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const { loanId, userId, type } = paymentIntent.metadata;

      if (!loanId) {
        console.warn("payment_intent.succeeded with no loanId in metadata:", paymentIntent.id);
        break;
      }

      // === IDEMPOTENCY CHECK ===
      // Check if we've already processed this PaymentIntent
      const existingPayments = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.reference, paymentIntent.id));

      if (existingPayments.length > 0) {
        // Already processed — return success without double-processing
        console.log(`Webhook idempotent skip: payment ${paymentIntent.id} already recorded`);
        break;
      }

      const [loan] = await db
        .select()
        .from(schema.loans)
        .where(eq(schema.loans.loanId, loanId));

      if (!loan) {
        console.error(`Loan not found for loanId: ${loanId}`);
        break;
      }

      // Record the payment
      await db.insert(schema.payments).values({
        loanId: loan.id,
        userId: userId || loan.userId,
        amount: (paymentIntent.amount / 100).toFixed(2),
        type: type || "interest",
        reference: paymentIntent.id,
      });

      // Update loan status ONLY from a verified webhook — never from the client
      if (type === "redemption") {
        // Double-check loan isn't already redeemed (idempotency on loan status)
        if (loan.status !== "redeemed") {
          await db
            .update(schema.loans)
            .set({
              status: "redeemed",
              redeemedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(schema.loans.id, loan.id));
        }
      } else {
        // Interest payment — add to total (but only if not already counted)
        const newTotal = (parseFloat(loan.totalInterestPaid || "0") + paymentIntent.amount / 100).toFixed(2);
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
      break;
    }

    case "payment_intent.payment_failed": {
      console.error("Payment failed:", event.data.object.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
