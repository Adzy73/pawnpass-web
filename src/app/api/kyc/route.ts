import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { stripe, IS_STRIPE_CONFIGURED } from "@/lib/stripe";
import { eq } from "drizzle-orm";

// Create a Stripe Identity verification session
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check current KYC status
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.kycStatus === "verified") {
    return NextResponse.json({ error: "Already verified", kycStatus: "verified" }, { status: 400 });
  }

  // If Stripe isn't configured, return manual verification mode
  if (!IS_STRIPE_CONFIGURED || !stripe) {
    // Mark as pending manual review
    await db.update(schema.users)
      .set({ kycStatus: "pending", kycReference: `manual-${Date.now()}`, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    return NextResponse.json({
      mode: "manual",
      message: "Identity verification submitted for manual review. We'll verify your ID within 24 hours.",
      kycStatus: "pending",
    });
  }

  try {
    // Create Stripe Identity verification session
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
          require_matching_selfie: true,
        },
      },
    });

    // Save session reference
    await db.update(schema.users)
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
    return NextResponse.json(
      { error: "Failed to create verification session" },
      { status: 500 }
    );
  }
}

// Check KYC status
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If Stripe is configured and user is pending, check for updates
  if (IS_STRIPE_CONFIGURED && stripe && user.kycStatus === "pending" && user.kycReference?.startsWith("vs_")) {
    try {
      const session = await stripe.identity.verificationSessions.retrieve(user.kycReference);
      if (session.status === "verified") {
        await db.update(schema.users)
          .set({
            kycStatus: "verified",
            kycVerifiedAt: new Date(),
            kycDetails: JSON.stringify({
              name: (session.verified_outputs as any)?.name || null,
              dob: (session.verified_outputs as any)?.dob || null,
              address: (session.verified_outputs as any)?.address || null,
            }),
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));
        return NextResponse.json({ kycStatus: "verified" });
      } else if (session.status === "requires_input" || (session.status as string) === "requires_action") {
        return NextResponse.json({ kycStatus: "pending" });
      }
    } catch {
      // Fall through to return stored status
    }
  }

  return NextResponse.json({ kycStatus: user.kycStatus });
}
