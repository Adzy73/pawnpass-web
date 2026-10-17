import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { sendCustomerWelcome, sendAdminAlertEmail, IS_AGENTMAIL_CONFIGURED } from "@/lib/agentmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phone } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Check if already registered
    const existing = await db
      .select()
      .from(schema.launchSignups)
      .where(eq(schema.launchSignups.email, email));

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "You're already on the list! We'll notify you when PawnPass goes live.",
        alreadyRegistered: true,
      });
    }

    await db.insert(schema.launchSignups).values({
      email,
      name: name || null,
      phone: phone || null,
    });

    // Get total signup count
    const [{ total }] = await db.select({ total: count() }).from(schema.launchSignups);

    // Send emails via AgentMail (non-blocking)
    Promise.allSettled([
      sendCustomerWelcome(email, name || null),
      sendAdminAlertEmail(email, name || null, total),
    ]);

    return NextResponse.json({
      success: true,
      message: "You're on the list! Check your inbox for a confirmation. We'll notify you the moment PawnPass goes live.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong", detail: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
