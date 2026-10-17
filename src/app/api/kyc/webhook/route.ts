import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { stripe, IS_STRIPE_CONFIGURED } from "@/lib/stripe";
import { eq } from "drizzle-orm";

// POST /api/kyc/webhook
// Stripe webhook handler for identity.verification_session.verified / .failed events.
// Verifies the Stripe signature against STRIPE_WEBHOOK_SECRET.
// In mock mode (no Stripe), this endpoint is a no-op that returns 200.
export async function POST(request: NextRequest) {
  // ── MOCK MODE ──────────────────────────────────────────────────────
  if (!IS_STRIPE_CONFIGURED || !stripe) {
    return NextResponse.json({ received: true, mode: "mock", note: "Webhook ignored in mock mode" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: "Webhook secret or signature missing" }, { status: 400 });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "identity.verification_session.verified": {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        if (!userId) break;

        const outputs = session.verified_outputs || {};
        await db
          .update(schema.users)
          .set({
            kycStatus: "verified",
            kycVerifiedAt: new Date(),
            kycDetails: JSON.stringify({
              name: outputs.name || null,
              dob: outputs.dob || null,
              address: outputs.address || null,
              email: outputs.email || null,
              phone: outputs.phone || null,
            }),
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));
        break;
      }
      case "identity.verification_session.failed": {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        if (!userId) break;

        await db
          .update(schema.users)
          .set({
            kycStatus: "failed",
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));
        break;
      }
      default:
        // Unhandled event type — acknowledge but ignore
        break;
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
