import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { stripe, IS_STRIPE_CONFIGURED } from "@/lib/stripe";
import { eq } from "drizzle-orm";

// POST /api/kyc/create
// Creates a Stripe Identity VerificationSession (or auto-approves in mock mode)
// Returns { mode: "stripe", clientSecret, verificationSessionId } or { mode: "mock", kycStatus: "verified" }
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.kycStatus === "verified") {
    return NextResponse.json({
      mode: "mock",
      kycStatus: "verified",
      message: "Already verified",
    });
  }

  // ── MOCK MODE ──────────────────────────────────────────────────────
  // No STRIPE_SECRET_KEY configured → auto-approve for development.
  // This lets the full onboarding flow work end-to-end without a Stripe account.
  if (!IS_STRIPE_CONFIGURED || !stripe) {
    await db
      .update(schema.users)
      .set({
        kycStatus: "verified",
        kycReference: `mock-${Date.now()}`,
        kycVerifiedAt: new Date(),
        kycDetails: JSON.stringify({
          mode: "mock",
          note: "Auto-approved in development (no STRIPE_SECRET_KEY). Not valid for production.",
          verifiedAt: new Date().toISOString(),
        }),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));

    return NextResponse.json({
      mode: "mock",
      kycStatus: "verified",
      message: "Identity auto-verified in development mode. Configure STRIPE_SECRET_KEY for live verification.",
    });
  }

  // ── STRIPE IDENTITY MODE ───────────────────────────────────────────
  try {
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        userId,
        email: user.email,
      },
      options: {
        document: {
          allowed_types: ["driving_license", "passport"],
          require_id_number: true,
          require_matching_selfie: true, // selfie/face match (step 3)
        },
      },
    });

    await db
      .update(schema.users)
      .set({
        kycStatus: "pending",
        kycReference: verificationSession.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));

    return NextResponse.json({
      mode: "stripe",
      clientSecret: verificationSession.client_secret,
      verificationSessionId: verificationSession.id,
      kycStatus: "pending",
    });
  } catch (error) {
    console.error("Stripe Identity create error:", error);
    return NextResponse.json(
      { error: "Failed to create verification session", mode: "stripe" },
      { status: 500 }
    );
  }
}
