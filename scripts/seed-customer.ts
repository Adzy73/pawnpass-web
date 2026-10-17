import fs from "fs";
import path from "path";

const cwd = process.cwd();
const files = [".env.local", ".env"];

for (const file of files) {
  const fullPath = path.join(cwd, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[match[1]] = val;
      }
    }
  }
}

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL found in .env or .env.local!");
    process.exit(1);
  }

  const { db, schema } = await import("../src/lib/db");
  const bcrypt = (await import("bcryptjs")).default;
  const { eq } = await import("drizzle-orm");

  const email = "customer@pawnpass.com.au";
  const password = "PawnPass2026";
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Customer account
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  let userId: string;

  if (existing.length > 0) {
    await db.update(schema.users).set({
      passwordHash,
      role: "customer",
      kycStatus: "verified",
      kycVerifiedAt: new Date(),
    }).where(eq(schema.users.email, email));
    userId = existing[0].id;
    console.log("Updated existing customer account:", email);
  } else {
    const [user] = await db.insert(schema.users).values({
      email,
      name: "Adam Menadue",
      phone: "0418935267",
      passwordHash,
      role: "customer",
      kycStatus: "verified",
      kycVerifiedAt: new Date(),
      kycDetails: JSON.stringify({ name: "Adam Menadue", dob: "1985-05-15", address: "311 North East Road, Hampstead Gardens SA" }),
    }).returning();
    userId = user.id;
    console.log("Created new customer account:", user.email, "id:", user.id);
  }

  // 2. Admin account seed
  const adminEmail = "admin@pawnpass.com.au";
  const existingAdmin = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail));
  if (existingAdmin.length === 0) {
    await db.insert(schema.users).values({
      email: adminEmail,
      name: "PawnPass Admin",
      passwordHash,
      role: "admin",
      kycStatus: "verified",
    });
    console.log("Created admin account:", adminEmail);
  } else {
    await db.update(schema.users).set({ passwordHash, role: "admin" }).where(eq(schema.users.email, adminEmail));
    console.log("Updated admin password:", adminEmail);
  }

  // 3. Create sample customer loans including OVERDUE loan
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
  const daysAhead = (n: number) => new Date(now.getTime() + n * 86400000);

  const existingOverdue = await db.select().from(schema.loans).where(eq(schema.loans.loanId, "PP-LOAN-007-OVERDUE"));
  if (existingOverdue.length === 0) {
    await db.insert(schema.loans).values({
      loanId: "PP-LOAN-007-OVERDUE",
      userId,
      itemDescription: "Canon EOS R6 Camera Body — 24.1MP Full Frame",
      principal: 800,
      interestRate: "25.00%",
      isGold: false,
      status: "overdue",
      trackingNumber: "33PP007",
      dueDate: daysAgo(12), // 12 days past due
      pledgeTicketData: {
        borrowerName: "Adam Menadue",
        item: "Canon EOS R6 Camera Body — 24.1MP Full Frame",
        principal: 800,
        monthlyInterest: 200.00,
        dueDate: daysAgo(12).toISOString(),
      },
    });
    console.log("Seeded Overdue loan PP-LOAN-007-OVERDUE!");
  } else {
    await db.update(schema.loans).set({
      status: "overdue",
      dueDate: daysAgo(12),
    }).where(eq(schema.loans.loanId, "PP-LOAN-007-OVERDUE"));
    console.log("Updated Overdue loan PP-LOAN-007-OVERDUE to overdue status!");
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });