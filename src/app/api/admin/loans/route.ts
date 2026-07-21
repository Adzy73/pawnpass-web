import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { eq, desc } from "drizzle-orm";

const ADMIN_KEY = process.env.ADMIN_KEY || "pawnpass-admin-2026";

function isAdmin(request: NextRequest): boolean {
  return request.headers.get("x-admin-key") === ADMIN_KEY;
}

// GET: list all loans with payment info for admin
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allLoans = await db.select().from(schema.loans).orderBy(desc(schema.loans.createdAt));

  return NextResponse.json({
    loans: allLoans.map((l) => ({
      id: l.id,
      loanId: l.loanId,
      itemDescription: l.itemDescription,
      principal: l.principal,
      interestRate: l.interestRate,
      isGold: l.isGold,
      status: l.status,
      totalInterestPaid: l.totalInterestPaid,
      dueDate: l.dueDate,
      createdAt: l.createdAt,
      trackingNumber: l.trackingNumber,
    })),
  });
}

// POST: admin actions — approve loan, mark payment received, approve KYC
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "approve_loan": {
      // Move loan from pending_verification to active
      const { loanId } = body;
      if (!loanId) return NextResponse.json({ error: "loanId required" }, { status: 400 });

      const [updated] = await db.update(schema.loans)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(schema.loans.loanId, loanId))
        .returning();

      return NextResponse.json({ success: true, loan: updated });
    }

    case "mark_payment": {
      // Admin confirms they received a PayID/bank transfer
      const { loanId, amount, type, reference } = body;
      if (!loanId || !amount || !type) {
        return NextResponse.json({ error: "loanId, amount, type required" }, { status: 400 });
      }

      const [loan] = await db.select().from(schema.loans).where(eq(schema.loans.loanId, loanId));
      if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

      // Update loan interest paid
      const newTotal = (parseFloat(loan.totalInterestPaid || "0") + amount).toFixed(2);
      const [updated] = await db.update(schema.loans)
        .set({
          totalInterestPaid: newTotal,
          interestPaidThrough: new Date(),
          status: type === "redemption" ? "redeemed" : "active",
          redeemedAt: type === "redemption" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.loans.id, loan.id))
        .returning();

      // Record the payment
      await db.insert(schema.payments).values({
        loanId: loan.id,
        userId: loan.userId,
        amount: amount.toFixed(2),
        type,
        reference: reference || `PayID-${Date.now()}`,
      });

      return NextResponse.json({ success: true, loan: updated });
    }

    case "approve_kyc": {
      // Admin manually approves KYC for a user
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

      const [updated] = await db.update(schema.users)
        .set({ kycStatus: "verified", kycVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.users.id, userId))
        .returning({ id: schema.users.id, kycStatus: schema.users.kycStatus });

      return NextResponse.json({ success: true, user: updated });
    }

    case "reject_kyc": {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

      const [updated] = await db.update(schema.users)
        .set({ kycStatus: "failed", updatedAt: new Date() })
        .where(eq(schema.users.id, userId))
        .returning({ id: schema.users.id, kycStatus: schema.users.kycStatus });

      return NextResponse.json({ success: true, user: updated });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
