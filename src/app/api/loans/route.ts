import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create_loan":
        return await createLoan(body, userId);
      case "get_loans":
        return await getLoans(userId);
      case "pay_interest":
        return await payInterest(body, userId);
      case "redeem_loan":
        return await redeemLoan(body, userId);
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", detail: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

async function createLoan(body: any, userId: string) {
  const { customerName, itemDescription, loanAmount, interestRate, isGold, trackingNumber } = body;

  const [loan] = await db
    .insert(schema.loans)
    .values({
      loanId: `PP-LOAN-${Date.now()}`,
      userId,
      itemDescription,
      principal: loanAmount,
      interestRate,
      isGold: isGold || false,
      status: "pending_verification",
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      interestPaidThrough: new Date(),
      totalInterestPaid: "0",
      trackingNumber: trackingNumber || null,
    })
    .returning();

  return NextResponse.json({
    success: true,
    loan,
    pledge_ticket: {
      loan_id: loan.loanId,
      principal: loan.principal,
      interest_rate: loan.interestRate,
      due_date: loan.dueDate,
      item: itemDescription,
      status: "pending_verification",
      digital: true,
    },
  });
}

async function getLoans(userId: string) {
  const userLoans = await db
    .select()
    .from(schema.loans)
    .where(eq(schema.loans.userId, userId));

  return NextResponse.json({ loans: userLoans });
}

async function payInterest(body: any, userId: string) {
  const { loanId, amount } = body;

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

  const newTotal = (parseFloat(loan.totalInterestPaid || "0") + amount).toFixed(2);

  const [updated] = await db
    .update(schema.loans)
    .set({
      totalInterestPaid: newTotal,
      interestPaidThrough: new Date(),
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(schema.loans.id, loan.id))
    .returning();

  // Record the payment
  await db.insert(schema.payments).values({
    loanId: loan.id,
    userId,
    amount: amount.toFixed(2),
    type: "interest",
  });

  return NextResponse.json({
    success: true,
    loan: updated,
    payment_amount: amount,
    paid_at: new Date().toISOString(),
  });
}

async function redeemLoan(body: any, userId: string) {
  const { loanId } = body;

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

  const totalDue = loan.principal + (loan.principal * parseFloat(loan.interestRate) / 100);

  const [updated] = await db
    .update(schema.loans)
    .set({
      status: "redeemed",
      redeemedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.loans.id, loan.id))
    .returning();

  // Record the redemption payment
  await db.insert(schema.payments).values({
    loanId: loan.id,
    userId,
    amount: totalDue.toFixed(2),
    type: "redemption",
  });

  return NextResponse.json({
    success: true,
    loan: updated,
    total_due: totalDue,
    message: "Loan redeemed — your item will be shipped to your selected locker within 24 hours.",
  });
}
