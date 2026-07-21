import { pgTable, uuid, text, timestamp, integer, boolean, decimal, serial } from "drizzle-orm/pg-core";

// === USERS ===
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"), // customer | admin
  // KYC / Identity verification
  kycStatus: text("kyc_status").notNull().default("unverified"), // unverified | pending | verified | failed
  kycReference: text("kyc_reference"), // Stripe Identity verification session ID
  kycVerifiedAt: timestamp("kyc_verified_at", { withTimezone: true }),
  kycDetails: text("kyc_details"), // JSON: name, DOB, address from verification
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// === QUOTES ===
export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  category: text("category").notNull(),
  condition: text("condition").notNull(),
  brand: text("brand"),
  model: text("model"),
  description: text("description"),
  photoCount: integer("photo_count").default(0),
  estimatedValue: integer("estimated_value"),
  loanAmount: integer("loan_amount"),
  buyAmount: integer("buy_amount"),
  interestRate: text("interest_rate"),
  isGold: boolean("is_gold").default(false),
  confidence: integer("confidence"),
  engine: text("engine"), // perplexity | tavily | mock
  sources: text("sources"), // JSON array of URLs
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// === LOANS ===
export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: text("loan_id").notNull().unique(), // PP-LOAN-{timestamp}
  userId: uuid("user_id").references(() => users.id),
  quoteId: uuid("quote_id").references(() => quotes.id),
  itemDescription: text("item_description").notNull(),
  principal: integer("principal").notNull(),
  interestRate: text("interest_rate").notNull(),
  isGold: boolean("is_gold").default(false),
  status: text("status").notNull().default("pending_verification"),
  // pending_verification → active → redeemed | overdue | forfeited
  trackingNumber: text("tracking_number"),
  totalInterestPaid: decimal("total_interest_paid", { precision: 10, scale: 2 }).default("0"),
  interestPaidThrough: timestamp("interest_paid_through", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// === SHIPMENTS ===
export const shipments = pgTable("shipments", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id").references(() => loans.id),
  userId: uuid("user_id").references(() => users.id),
  direction: text("direction").notNull(), // inbound | outbound
  carrier: text("carrier").default("auspost"),
  trackingNumber: text("tracking_number"),
  shipmentId: text("shipment_id"),
  lockerId: text("locker_id"),
  status: text("status").default("draft"), // draft | lodged | in_transit | delivered
  cost: decimal("cost", { precision: 10, scale: 2 }),
  mock: boolean("mock").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// === LAUNCH SIGNUPS ===
export const launchSignups = pgTable("launch_signups", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  phone: text("phone"),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id").references(() => loans.id),
  userId: uuid("user_id").references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // interest | redemption | buy_outright
  reference: text("reference"), // Osko/payment ref
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
