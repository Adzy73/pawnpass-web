import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { stripe, IS_STRIPE_CONFIGURED } from "@/lib/stripe";
import { eq } from "drizzle-orm";

// Root /api/kyc handlers — kept for backward compatibility.
// New canonical endpoints: /api/kyc/create, /api/kyc/status, /api/kyc/webhook

// GET /api/kyc → same as /api/kyc/status (returns kycStatus)
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Live-poll Stripe if pending
  if (IS_STRIPE_CONFIGURED && stripe && user.kycStatus === "pending" && user.kycReference?.startsWith("vs_")) {
    try {
      const session = await stripe.identity.verificationSessions.retrieve(user.kycReference);
      if (session.status === "verified") {
        const outputs = (session.verified_outputs as any) || {};
        await db
          .update(schema.users)
          .set({
            kycStatus: "verified",
            kycVerifiedAt: new Date(),
            kycDetails: JSON.stringify({
              name: outputs.name || null,
              dob: outputs.dob || null,
              address: outputs.address || null,
            }),
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));
        return NextResponse.json({ kycStatus: "verified" });
      }
      if (session.status === "requires_input" || (session.status as string) === "requires_action") {
        return NextResponse.json({ kycStatus: "pending" });
      }
    } catch {
      // fall through to stored status
    }
  }

  return NextResponse.json({ kycStatus: user.kycStatus });
}

// POST /api/kyc → same as /api/kyc/create (legacy single-route clients)
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
    return NextResponse.json({ mode: "mock", kycStatus: "verified", message: "Already verified" });
  }

  // Mock mode — auto-approve
  if (!IS_STRIPE_CONFIGURED || !stripe) {
    await db
      .update(schema.users)
      .set({
        kycStatus: "verified",
        kycReference: `mock-${Date.now()}`,
        kycVerifiedAt: new Date(),
        kycDetails: JSON.stringify({
          mode: "mock",
          note: "Auto-approved in development (no STRIPE_SECRET_KEY).",
          verifiedAt: new Date().toISOString(),
        }),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));

    return NextResponse.json({
      mode: "mock",
      kycStatus: "verified",
      message: "Identity auto-verified in development mode.",
    });
  }

  // Stripe Identity live mode
  try {
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { userId, email: user.email },
      options: {
        document: {
          allowed_types: ["driving_license", "passport"],
          require_id_number: true,
          require_matching_selfie: true,
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
    console.error("Stripe Identity error:", error);
    return NextResponse.json({ error: "Failed to create verification session" }, { status: 500 });
  }
}
