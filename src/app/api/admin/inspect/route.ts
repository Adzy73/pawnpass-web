import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { eq } from "drizzle-orm";

// POST /api/admin/inspect
// Inspector actions: mark received, inspect, confirm, counter-offer, return
// Two-person rule: inspector marks, separate approver releases payout

const VALID_ACTIONS = [
  "mark_received",      // Item arrived at hub
  "confirm_quote",       // Inspection matches quote → activate loan
  "counter_offer",       // Inspection differs → send revised offer
  "accept_counter",      // Customer accepted counter-offer (via secure link)
  "decline_counter",     // Customer declined → return item
  "approve_payout",      // Second approver releases payment
  "mark_returned",       // Item shipped back to customer
  // ── Additional admin actions ──
  "extend_loan",         // Extend due date by 30 days
  "forfeit",             // Forfeit item — PawnPass takes ownership
  "redeem",              // Mark loan as redeemed (paid in full)
  "release_hold",        // Release 10-day hold — item available for resale
  "add_note",            // Append a note to the loan's audit trail
  "send_sms",            // Log SMS sent to customer (actual SMS via gateway later)
  "send_email",          // Log email sent to customer (actual email via SMTP later)
];

// Helper: append a note to a loan's notes array
async function appendNote(loanId: string, noteText: string, userId: string) {
  const [loan] = await db.select().from(schema.loans).where(eq(schema.loans.id, loanId));
  if (!loan) return;
  const existingNotes = Array.isArray(loan.notes) ? loan.notes : [];
  const newNote = {
    text: noteText,
    userId,
    createdAt: new Date().toISOString(),
  };
  await db.update(schema.loans).set({
    notes: [...existingNotes, newNote],
    updatedAt: new Date(),
  }).where(eq(schema.loans.id, loan.id));
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check user is admin (or inspector role)
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user || (user.role !== "admin" && user.role !== "inspector")) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const body = await request.json();
  const { action, loanId, notes, counterAmount, counterReason, noteText, message } = body;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const [loan] = await db
    .select()
    .from(schema.loans)
    .where(eq(schema.loans.loanId, loanId));

  if (!loan) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  switch (action) {
    // ── MARK RECEIVED: Item has arrived at the hub ──
    case "mark_received": {
      if (loan.status !== "pending_verification" && loan.status !== "shipped") {
        return NextResponse.json({ error: `Cannot mark received — current status: ${loan.status}` }, { status: 400 });
      }
      await db.update(schema.loans).set({
        status: "received",
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));
      await appendNote(loan.id, "Item marked as received at hub", userId);
      return NextResponse.json({ status: "received", message: "Item marked as received at hub" });
    }

    // ── CONFIRM QUOTE: Inspection matches the quote → activate loan ──
    case "confirm_quote": {
      if (loan.status !== "received" && loan.status !== "pending_verification") {
        return NextResponse.json({ error: `Cannot confirm — item not received. Current status: ${loan.status}` }, { status: 400 });
      }
      await db.update(schema.loans).set({
        status: "active",
        inspectedBy: userId,
        inspectedAt: new Date(),
        inspectionNotes: notes || "Inspection confirmed — matches quote",
        payoutStatus: "pending", // Waiting for second approver
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));
      await appendNote(loan.id, notes || "Loan approved — inspection passed", userId);
      return NextResponse.json({ status: "active", message: "Loan activated. Payout pending approval." });
    }

    // ── COUNTER OFFER: Inspection differs from quote → send revised offer ──
    case "counter_offer": {
      if (loan.status !== "received" && loan.status !== "pending_verification") {
        return NextResponse.json({ error: `Cannot counter-offer — item not received` }, { status: 400 });
      }
      if (!counterAmount || counterAmount <= 0) {
        return NextResponse.json({ error: "counterAmount is required" }, { status: 400 });
      }
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours to respond

      await db.update(schema.loans).set({
        status: "counter_offered",
        counterOfferAmount: counterAmount,
        counterOfferReason: counterReason || "Item condition differs from quote",
        counterOfferStatus: "pending",
        counterOfferExpiresAt: expiresAt,
        inspectedBy: userId,
        inspectedAt: new Date(),
        inspectionNotes: notes || "",
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));

      await appendNote(loan.id, `Counter-offer sent: $${counterAmount} — ${counterReason || "Item condition differs from quote"}`, userId);

      // TODO: Send email/notification to customer with secure link
      return NextResponse.json({
        status: "counter_offered",
        counterAmount,
        expiresAt: expiresAt.toISOString(),
        message: "Counter-offer sent to customer. Expires in 48 hours.",
      });
    }

    // ── ACCEPT COUNTER: Customer accepted the revised offer ──
    case "accept_counter": {
      if (loan.status !== "counter_offered" || loan.counterOfferStatus !== "pending") {
        return NextResponse.json({ error: "No pending counter-offer" }, { status: 400 });
      }
      // Check expiry
      if (loan.counterOfferExpiresAt && new Date() > loan.counterOfferExpiresAt) {
        await db.update(schema.loans).set({
          counterOfferStatus: "expired",
          status: "returned",
          updatedAt: new Date(),
        }).where(eq(schema.loans.id, loan.id));
        return NextResponse.json({ error: "Counter-offer has expired" }, { status: 400 });
      }

      await db.update(schema.loans).set({
        status: "active",
        principal: loan.counterOfferAmount!, // Update principal to revised amount
        counterOfferStatus: "accepted",
        payoutStatus: "pending", // Waiting for second approver
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));

      await appendNote(loan.id, "Counter-offer accepted by customer", userId);

      return NextResponse.json({ status: "active", message: "Counter-offer accepted. Payout pending approval." });
    }

    // ── DECLINE COUNTER: Customer declined → return item ──
    case "decline_counter": {
      if (loan.status !== "counter_offered") {
        return NextResponse.json({ error: "No counter-offer to decline" }, { status: 400 });
      }
      await db.update(schema.loans).set({
        status: "returned",
        counterOfferStatus: "declined",
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));

      await appendNote(loan.id, "Counter-offer declined — returning item to customer", userId);

      // TODO: Generate return shipping label
      return NextResponse.json({ status: "returned", message: "Counter-offer declined. Return label will be sent." });
    }

    // ── APPROVE PAYOUT: Second approver releases payment ──
    case "approve_payout": {
      if (loan.status !== "active") {
        return NextResponse.json({ error: "Loan must be active to approve payout" }, { status: 400 });
      }
      if (loan.payoutStatus === "sent") {
        return NextResponse.json({ error: "Payout already sent" }, { status: 400 });
      }
      if (loan.inspectedBy === userId) {
        return NextResponse.json({ error: "Cannot approve own inspection — two-person rule" }, { status: 403 });
      }

      await db.update(schema.loans).set({
        payoutStatus: "approved",
        payoutApprovedBy: userId,
        payoutApprovedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));

      // TODO: Trigger Osko/NPP payment here
      // For now, mark as sent
      await db.update(schema.loans).set({
        payoutStatus: "sent",
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));

      await appendNote(loan.id, "Payout approved and sent via Osko", userId);

      return NextResponse.json({ status: "active", payoutStatus: "sent", message: "Payout approved and sent via Osko." });
    }

    // ── MARK RETURNED: Item shipped back to customer ──
    case "mark_returned": {
      await db.update(schema.loans).set({
        status: "returned",
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));
      await appendNote(loan.id, "Item marked as returned to customer", userId);
      return NextResponse.json({ status: "returned", message: "Item marked as returned" });
    }

    // ── EXTEND LOAN: Extend due date by 30 days ──
    case "extend_loan": {
      if (loan.status !== "active" && loan.status !== "overdue" && loan.status !== "counter_offered") {
        return NextResponse.json({ error: `Cannot extend — loan not active (current: ${loan.status})` }, { status: 400 });
      }
      const currentDue = new Date(loan.dueDate);
      const newDue = new Date(currentDue.getTime() + 30 * 86400000);
      const prevStatus = loan.status;
      await db.update(schema.loans).set({
        dueDate: newDue,
        status: "active", // If was overdue, re-activate
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));
      await appendNote(loan.id, `Loan extended 30 days (was ${prevStatus}) — new due date: ${newDue.toLocaleDateString("en-AU")}`, userId);
      return NextResponse.json({ status: "active", dueDate: newDue.toISOString(), message: `Loan extended to ${newDue.toLocaleDateString("en-AU")}` });
    }

    // ── FORFEIT: Customer forfeited the item ──
    case "forfeit": {
      if (loan.status === "forfeited") {
        return NextResponse.json({ error: "Already forfeited" }, { status: 400 });
      }
      if (loan.status === "redeemed" || loan.status === "returned") {
        return NextResponse.json({ error: `Cannot forfeit — loan is ${loan.status}` }, { status: 400 });
      }
      await db.update(schema.loans).set({
        status: "forfeited",
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));
      await appendNote(loan.id, "Forfeited — item now PawnPass property", userId);
      return NextResponse.json({ status: "forfeited", message: "Item forfeited. PawnPass takes ownership." });
    }

    // ── REDEEM: Customer paid in full, loan redeemed ──
    case "redeem": {
      if (loan.status !== "active" && loan.status !== "overdue") {
        return NextResponse.json({ error: `Cannot redeem — loan not active (current: ${loan.status})` }, { status: 400 });
      }
      await db.update(schema.loans).set({
        status: "redeemed",
        redeemedAt: new Date(),
        interestPaidThrough: new Date(),
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));
      await appendNote(loan.id, "Redeemed — payment received in full", userId);
      return NextResponse.json({ status: "redeemed", message: "Loan redeemed in full." });
    }

    // ── RELEASE HOLD: 10-day hold expired, item available for resale ──
    case "release_hold": {
      if (loan.status !== "on_hold") {
        return NextResponse.json({ error: `Cannot release hold — loan not on hold (current: ${loan.status})` }, { status: 400 });
      }
      await db.update(schema.loans).set({
        status: "forfeited", // Buy-outright items go to forfeited (PawnPass property)
        updatedAt: new Date(),
      }).where(eq(schema.loans.id, loan.id));
      await appendNote(loan.id, "10-day hold released — item available for resale", userId);
      return NextResponse.json({ status: "forfeited", message: "Hold released. Item available for resale." });
    }

    // ── ADD NOTE: Append a note to the loan's audit trail ──
    case "add_note": {
      if (!noteText || !noteText.trim()) {
        return NextResponse.json({ error: "noteText is required" }, { status: 400 });
      }
      await appendNote(loan.id, noteText.trim(), userId);
      return NextResponse.json({ success: true, message: "Note added" });
    }

    // ── SEND SMS: Log SMS sent to customer ──
    case "send_sms": {
      if (!message || !message.trim()) {
        return NextResponse.json({ error: "message is required" }, { status: 400 });
      }
      await appendNote(loan.id, `SMS sent: "${message.trim()}"`, userId);
      // TODO: Wire to actual SMS gateway (Twilio/MessageMedia)
      return NextResponse.json({ success: true, message: "SMS logged (gateway not yet wired)" });
    }

    // ── SEND EMAIL: Log email sent to customer ──
    case "send_email": {
      if (!message || !message.trim()) {
        return NextResponse.json({ error: "message is required" }, { status: 400 });
      }
      await appendNote(loan.id, `Email sent: "${message.trim()}"`, userId);
      // TODO: Wire to actual SMTP/Gmail gateway
      return NextResponse.json({ success: true, message: "Email logged (gateway not yet wired)" });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

// GET /api/admin/inspect — list all loans for admin dashboard
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user || (user.role !== "admin" && user.role !== "inspector")) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const allLoans = await db.select().from(schema.loans);
  
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
      interestPaidThrough: l.interestPaidThrough,
      dueDate: l.dueDate,
      redeemedAt: l.redeemedAt,
      createdAt: l.createdAt,
      trackingNumber: l.trackingNumber,
      notes: Array.isArray(l.notes) ? l.notes : [],
      counterOfferAmount: l.counterOfferAmount,
      counterOfferReason: l.counterOfferReason,
      counterOfferStatus: l.counterOfferStatus,
      counterOfferExpiresAt: l.counterOfferExpiresAt,
      payoutStatus: l.payoutStatus,
    })),
  });
}
