import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { stripe, IS_STRIPE_CONFIGURED } from "@/lib/stripe";
import { eq } from "drizzle-orm";

// GET /api/kyc/status
// Returns { kycStatus: "unverified" | "pending" | "verified" | "failed", details? }
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If Stripe is live and user is pending, poll the VerificationSession for updates
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
              email: outputs.email || null,
              phone: outputs.phone || null,
            }),
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));
        return NextResponse.json({ kycStatus: "verified", details: outputs });
      }

      if (session.status === "requires_input" || (session.status as string) === "requires_action") {
        // User still needs to complete steps → still pending
        return NextResponse.json({ kycStatus: "pending" });
      }

      // Some sessions land in "canceled" or other terminal states → treat as failed
      if (["canceled", "failed"].includes(session.status)) {
        await db
          .update(schema.users)
          .set({ kycStatus: "failed", updatedAt: new Date() })
          .where(eq(schema.users.id, userId));
        return NextResponse.json({ kycStatus: "failed" });
      }
    } catch (err) {
      console.error("Stripe status poll error:", err);
      // fall through to stored status
    }
  }

  return NextResponse.json({ kycStatus: user.kycStatus });
}
