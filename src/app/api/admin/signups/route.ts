import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, count } from "drizzle-orm";

const ADMIN_KEY = process.env.ADMIN_KEY || "pawnpass-admin-2026";

export async function GET(request: NextRequest) {
  const authKey = request.headers.get("x-admin-key");
  if (authKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signups = await db
    .select()
    .from(schema.launchSignups)
    .orderBy(desc(schema.launchSignups.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(schema.launchSignups);
  const notified = signups.filter((s) => s.notifiedAt !== null).length;

  return NextResponse.json({
    total,
    notified,
    notNotified: total - notified,
    signups: signups.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      phone: s.phone,
      createdAt: s.createdAt,
      notifiedAt: s.notifiedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const authKey = request.headers.get("x-admin-key");
  if (authKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === "mark_notified") {
    const { email } = body;
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    await db
      .update(schema.launchSignups)
      .set({ notifiedAt: new Date() })
      .where(eq(schema.launchSignups.email, email));

    return NextResponse.json({ success: true, message: `${email} marked as notified` });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

import { eq } from "drizzle-orm";
