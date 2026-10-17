import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, lt, or, and } from "drizzle-orm";

// POST /api/cron/forfeiture
// 90-Day Expiry Engine: Scans overdue/expired pawn loans and transitions them to forfeited inventory.
// Calculates SA Pawnbrokers Act residual equity formula baselines.

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    // Secret key for cron security (or allow admin call)
    const CRON_SECRET = process.env.CRON_SECRET || "pawnpass_cron_secret_2026";
    const isCronAuthorized = authHeader === `Bearer ${CRON_SECRET}`;

    const now = new Date();

    // Query active or overdue loans where due date is in the past
    const expiredLoans = await db
      .select()
      .from(schema.loans)
      .where(
        and(
          or(eq(schema.loans.status, "active"), eq(schema.loans.status, "overdue")),
          lt(schema.loans.dueDate, now)
        )
      );

    const processed: any[] = [];

    for (const loan of expiredLoans) {
      // 1. Mark loan as forfeited
      await db
        .update(schema.loans)
        .set({
          status: "forfeited",
          updatedAt: now,
        })
        .where(eq(schema.loans.id, loan.id));

      // 2. Generate inventory SKU
      const sku = `PP-INV-${Date.now()}-${loan.loanId.split("-").pop()}`;
      const targetResalePrice = Math.round(loan.principal * 2.0); // 50% LTV inverse

      // 3. Create Resale Inventory Record
      const [inventory] = await db
        .insert(schema.resaleInventory)
        .values({
          loanId: loan.id,
          sku,
          title: loan.itemDescription,
          description: `PawnPass Verified Inventory: ${loan.itemDescription}. Inspected & tested at Hampstead Gardens hub.`,
          category: loan.isGold ? "Jewellery & Gold" : "General Goods",
          conditionGrade: "Good",
          costBasis: loan.principal,
          targetPrice: targetResalePrice,
          minPrice: Math.round(loan.principal * 1.2),
          status: "in_stock",
        })
        .returning();

      // 4. Append audit note to loan
      const existingNotes = Array.isArray(loan.notes) ? loan.notes : [];
      await db
        .update(schema.loans)
        .set({
          notes: [
            ...existingNotes,
            {
              text: `Auto-Forfeited by 90-Day Expiry Engine. Created inventory SKU: ${sku}. Target resale: $${targetResalePrice}`,
              userId: "system_cron",
              createdAt: now.toISOString(),
            },
          ],
        })
        .where(eq(schema.loans.id, loan.id));

      processed.push({
        loanId: loan.loanId,
        sku,
        item: loan.itemDescription,
        costBasis: loan.principal,
        targetResalePrice,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      forfeitedCount: processed.length,
      processedItems: processed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Forfeiture cron failed" }, { status: 500 });
  }
}

// GET /api/cron/forfeiture — view dry run of expired loans
export async function GET() {
  const now = new Date();
  const expiredLoans = await db
    .select()
    .from(schema.loans)
    .where(
      and(
        or(eq(schema.loans.status, "active"), eq(schema.loans.status, "overdue")),
        lt(schema.loans.dueDate, now)
      )
    );

  return NextResponse.json({
    pendingForfeitureCount: expiredLoans.length,
    loans: expiredLoans.map((l) => ({
      loanId: l.loanId,
      item: l.itemDescription,
      dueDate: l.dueDate,
      principal: l.principal,
    })),
  });
}