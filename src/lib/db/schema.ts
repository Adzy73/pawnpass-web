import { pgTable, uuid, text, timestamp, integer, boolean, decimal, serial, jsonb } from "drizzle-orm/pg-core";

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
  // Full lifecycle:
  // pending_verification → shipped → received → inspected → active
  //                                ↓
  //                          counter_offered → accepted (→ active) | declined (→ returned)
  // active → redeemed | overdue | forfeited
  trackingNumber: text("tracking_number"),
  totalInterestPaid: decimal("total_interest_paid", { precision: 10, scale: 2 }).default("0"),
  interestPaidThrough: timestamp("interest_paid_through", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  // Counter-offer fields
  counterOfferAmount: integer("counter_offer_amount"), // revised loan amount after inspection
  counterOfferReason: text("counter_offer_reason"), // why the offer changed
  counterOfferStatus: text("counter_offer_status"), // pending | accepted | declined | expired
  counterOfferExpiresAt: timestamp("counter_offer_expires_at", { withTimezone: true }),
  // Inspection fields
  inspectedBy: uuid("inspected_by").references(() => users.id),
  inspectedAt: timestamp("inspected_at", { withTimezone: true }),
  inspectionNotes: text("inspection_notes"),
  // Payout approval (two-person rule)
  payoutApprovedBy: uuid("payout_approved_by").references(() => users.id),
  payoutApprovedAt: timestamp("payout_approved_at", { withTimezone: true }),
  payoutStatus: text("payout_status").default("pending"), // pending | approved | sent
  // Admin notes (append-only audit trail)
  notes: jsonb("notes").default([]), // [{ text, userId, createdAt }]
  // Digital pledge ticket — structured data rendered client-side
  pledgeTicketData: jsonb("pledge_ticket_data"),
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

// === RESALE INVENTORY (FORFEITED GOODS) ===
export const resaleInventory = pgTable("resale_inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id").references(() => loans.id),
  sku: text("sku").notNull().unique(), // PP-INV-{timestamp}
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  conditionGrade: text("condition_grade").notNull(), // Mint | Excellent | Good | Fair
  costBasis: integer("cost_basis").notNull(), // Principal + interest unpaid
  targetPrice: integer("target_price").notNull(), // Estimated resale price
  minPrice: integer("min_price").notNull(), // Lowest acceptable offer
  status: text("status").notNull().default("in_stock"), // in_stock | listed | sold | disposed
  soldPrice: integer("sold_price"),
  soldPlatform: text("sold_platform"), // ebay | facebook | gumtree | vinted | private
  soldAt: timestamp("sold_at", { withTimezone: true }),
  costOfSale: decimal("cost_of_sale", { precision: 10, scale: 2 }), // 51% + 0.04%/day
  residualEquityAmount: decimal("residual_equity_amount", { precision: 10, scale: 2 }), // Surplus returned to borrower
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// === MULTI-PLATFORM LISTINGS ===
export const resaleListings = pgTable("resale_listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  inventoryId: uuid("inventory_id").references(() => resaleInventory.id),
  platform: text("platform").notNull(), // ebay | facebook | gumtree | vinted
  externalListingId: text("external_listing_id"), // Platform API listing ID
  listingUrl: text("listing_url"),
  status: text("status").notNull().default("pending"), // pending | active | sold | delisted | error
  listPrice: integer("list_price").notNull(),
  viewsCount: integer("views_count").default(0),
  inquiriesCount: integer("inquiries_count").default(0),
  errorMessage: text("error_message"),
  listedAt: timestamp("listed_at", { withTimezone: true }),
  delistedAt: timestamp("delisted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
