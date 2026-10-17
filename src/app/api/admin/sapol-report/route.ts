import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { eq, gte, and } from "drizzle-orm";

// GET /api/admin/sapol-report?date=2026-08-09
// Generates a daily transaction report for SAPOL (SA Police) compliance
// Under SA Second-hand Dealers and Pawnbrokers Act

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const dateParam = request.nextUrl.searchParams.get("date");
  const reportDate = dateParam ? new Date(dateParam) : new Date();
  
  // Start of day
  const startOfDay = new Date(reportDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  // End of day
  const endOfDay = new Date(reportDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all loans created on this date
  const dayLoans = await db
    .select({
      loan: schema.loans,
      user: schema.users,
    })
    .from(schema.loans)
    .innerJoin(schema.users, eq(schema.loans.userId, schema.users.id))
    .where(
      and(
        gte(schema.loans.createdAt, startOfDay),
        gte(schema.loans.updatedAt, startOfDay) // fallback
      )
    );

  // Build SAPOL report
  const transactions = dayLoans
    .filter(({ loan }) => {
      const created = new Date(loan.createdAt);
      return created >= startOfDay && created <= endOfDay;
    })
    .map(({ loan, user }) => ({
      // Transaction details
      transaction_date: new Date(loan.createdAt).toISOString().split("T")[0],
      transaction_time: new Date(loan.createdAt).toTimeString().split(" ")[0],
      transaction_id: loan.loanId,
      transaction_type: "pawn_loan",
      
      // Item details
      item_description: loan.itemDescription,
      item_category: loan.isGold ? "gold/jewellery" : "other",
      
      // Customer identity (from KYC)
      customer_name: user.name,
      customer_email: user.email,
      customer_phone: user.phone || "",
      customer_address: loan.pledgeTicketData 
        ? (loan.pledgeTicketData as any)?.customer?.address || ""
        : "",
      customer_dob: loan.pledgeTicketData
        ? (loan.pledgeTicketData as any)?.customer?.dob || ""
        : "",
      kyc_reference: user.kycReference || "",
      kyc_verified: user.kycStatus === "verified",
      
      // Loan terms
      principal: loan.principal,
      interest_rate: loan.interestRate,
      due_date: new Date(loan.dueDate).toISOString().split("T")[0],
      
      // Status
      status: loan.status,
      tracking_number: loan.trackingNumber || "",
    }));

  const report = {
    report_date: startOfDay.toISOString().split("T")[0],
    generated_at: new Date().toISOString(),
    business: {
      name: "Pawn Pass",
      acl: "Theorify",
      address: "311 North East Road, Hampstead Gardens, SA 5086",
    },
    transaction_count: transactions.length,
    total_principal: transactions.reduce((sum, t) => sum + t.principal, 0),
    transactions,
  };

  // Return as JSON (can be exported to CSV/PDF)
  const format = request.nextUrl.searchParams.get("format");
  if (format === "csv") {
    // Generate CSV
    const headers = [
      "Date", "Time", "Transaction ID", "Type",
      "Item Description", "Category",
      "Customer Name", "Email", "Phone", "Address", "DOB",
      "KYC Ref", "KYC Verified",
      "Principal", "Rate", "Due Date",
      "Status", "Tracking"
    ];
    
    const rows = transactions.map((t) => [
      t.transaction_date, t.transaction_time, t.transaction_id, t.transaction_type,
      `"${t.item_description}"`, t.item_category,
      `"${t.customer_name}"`, t.customer_email, t.customer_phone, `"${t.customer_address}"`, t.customer_dob,
      t.kyc_reference, t.kyc_verified ? "Yes" : "No",
      t.principal, t.interest_rate, t.due_date,
      t.status, t.tracking_number,
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="sapol-report-${startOfDay.toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}
