"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { eq } from "drizzle-orm";

export type FormState =
  | { errors?: { name?: string[]; email?: string[]; password?: string[] }; message?: string }
  | undefined;

export async function signup(state: FormState, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const phone = formData.get("phone") as string;

  // Basic validation
  if (!name || name.length < 2) {
    return { errors: { name: ["Name must be at least 2 characters"] } };
  }
  if (!email || !email.includes("@")) {
    return { errors: { email: ["Please enter a valid email"] } };
  }
  if (!password || password.length < 8) {
    return { errors: { password: ["Password must be at least 8 characters"] } };
  }

  // Check if user already exists
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing.length > 0) {
    return { message: "An account with this email already exists" };
  }

  // Create user
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      name,
      phone: phone || null,
      passwordHash,
    })
    .returning({ id: schema.users.id });

  if (!user) {
    return { message: "Failed to create account" };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(state: FormState, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { message: "Email and password are required" };
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));

  if (!user) {
    return { message: "Invalid email or password" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { message: "Invalid email or password" };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
