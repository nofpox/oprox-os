import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { usersTable, organizationsTable } from "./core";

// ── Phase 2: Billing, Payments, Subscriptions ─────────────────────────────
export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(), // Stripe sub_xxx or internal sub_id
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id"),
    planId: text("plan_id").notNull().default("economy"),
    scheduledPlanId: text("scheduled_plan_id"),
    scheduledPlanEffectiveAt: timestamp("scheduled_plan_effective_at"),
    status: text("status").notNull().default("active"), // trialing | active | past_due | canceled | paused
    interval: text("interval").notNull().default("month"), // month | year
    currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
    currentPeriodEnd: timestamp("current_period_end").notNull().defaultNow(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    seatsCount: integer("seats_count").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("subscriptions_user_idx").on(t.userId),
    index("subscriptions_org_idx").on(t.orgId),
    index("subscriptions_stripe_customer_idx").on(t.stripeCustomerId),
  ]
);

export type SubscriptionRow = typeof subscriptionsTable.$inferSelect;

export const localInvoicesTable = pgTable(
  "local_invoices",
  {
    id: text("id").primaryKey(), // Stripe in_xxx or inv_xxx
    sequentialNumber: text("sequential_number").notNull().unique(),
    invoiceType: text("invoice_type").notNull().default("B2C_SIMPLIFIED_INVOICE"), // "B2B_TAX_INVOICE" | "B2C_SIMPLIFIED_INVOICE"
    stripeCustomerId: text("stripe_customer_id"),
    // Nullable — invoices may be created by system actors (e.g. RE automation) that do not have
    // a corresponding row in the platform users table. FK removed in migration 0019.
    userId: text("user_id"),
    // FK removed in migration 0020 — RE module uses arbitrary tenant IDs as org_id,
    // not rows in the platform organizations table.
    orgId: text("org_id"),
    amountDue: integer("amount_due").notNull().default(0), // minor units
    amountPaid: integer("amount_paid").notNull().default(0), // minor units
    subtotalHalalas: integer("subtotal_halalas").notNull().default(0),
    vatRateBps: integer("vat_rate_bps").notNull().default(1500), // 15.00%
    vatAmountHalalas: integer("vat_amount_halalas").notNull().default(0),
    totalAmountHalalas: integer("total_amount_halalas").notNull().default(0),
    currency: text("currency").notNull().default("SAR"), // SAR | USD
    status: text("status").notNull().default("paid"), // draft | open | paid | uncollectible | void
    sellerLegalName: text("seller_legal_name").default("OPROX OS Ecosystem Ltd."),
    sellerVatNumber: text("seller_vat_number").default("310000000000003"),
    buyerLegalName: text("buyer_legal_name"),
    buyerVatNumber: text("buyer_vat_number"),
    qrCodePayload: text("qr_code_payload"),
    structuredData: jsonb("structured_data").default({}),
    creditNoteRef: text("credit_note_ref"),
    debitNoteRef: text("debit_note_ref"),
    invoicePdfUrl: text("invoice_pdf_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("invoices_user_idx").on(t.userId),
    index("invoices_org_idx").on(t.orgId),
    index("invoices_stripe_customer_idx").on(t.stripeCustomerId),
  ]
);

export type LocalInvoiceRow = typeof localInvoicesTable.$inferSelect;

// ── Phase 4: Pricing Catalog & Business Policy ─────────────────────────────
export const plansCatalogTable = pgTable("plans_catalog", {
  id: text("id").primaryKey(), // plan code (e.g., "starter", "pro", "enterprise")
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  active: boolean("active").notNull().default(false),
  priceSarHalalas: integer("price_sar_halalas"), // null if unset/draft
  priceUsdCents: integer("price_usd_cents"), // null if unset/draft
  billingInterval: text("billing_interval").notNull().default("monthly"), // "monthly" | "annual"
  includedAiMicros: integer("included_ai_micros").notNull().default(0),
  featureEntitlements: jsonb("feature_entitlements").notNull().default([]),
  maxUsers: integer("max_users").notNull().default(10),
  upgradeRules: jsonb("upgrade_rules").notNull().default({ immediate: true }),
  downgradeRules: jsonb("downgrade_rules").notNull().default({ atPeriodEnd: true }),
  effectiveDate: timestamp("effective_date"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PlanCatalogRow = typeof plansCatalogTable.$inferSelect;

export const paymentMethodsConfigTable = pgTable("payment_methods_config", {
  id: text("id").primaryKey(), // mada | stc_pay | barq_pay | bank_transfer | credit_card
  name: text("name").notNull(),
  provider: text("provider").notNull().default("stripe"),
  enabled: boolean("enabled").notNull().default(false),
  currency: text("currency").notNull().default("SAR"),
  paymentMethodType: text("payment_method_type").notNull(),
  status: text("status").notNull().default("active"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PaymentMethodConfigRow = typeof paymentMethodsConfigTable.$inferSelect;

export const dualApprovalRequestsTable = pgTable(
  "dual_approval_requests",
  {
    id: text("id").primaryKey(), // req_xxx
    actionType: text("action_type").notNull(),
    requestedBy: text("requested_by").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    requestedAt: timestamp("requested_at").notNull().defaultNow(),
    amountMicros: integer("amount_micros"),
    payload: jsonb("payload").notNull().default({}),
    status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED | EXPIRED
    firstApprovedBy: text("first_approved_by").references(() => usersTable.id, { onDelete: "set null" }),
    firstApprovedAt: timestamp("first_approved_at"),
    secondApprovedBy: text("second_approved_by").references(() => usersTable.id, { onDelete: "set null" }),
    secondApprovedAt: timestamp("second_approved_at"),
    executedAt: timestamp("executed_at"),
    rejectionNote: text("rejection_note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("dual_approval_requested_by_idx").on(t.requestedBy),
    index("dual_approval_status_idx").on(t.status),
  ]
);

export type DualApprovalRequestRow = typeof dualApprovalRequestsTable.$inferSelect;

export const aiModelPricingMetadataTable = pgTable("ai_model_pricing_metadata", {
  modelId: text("model_id").primaryKey(), // gemini-1.5-pro | gemini-1.5-flash | gpt-4o | claude-3-5-sonnet
  provider: text("provider").notNull(), // gemini | openai | anthropic
  promptTokensMicrosPer1k: integer("prompt_tokens_micros_per_1k").notNull().default(150),
  completionTokensMicrosPer1k: integer("completion_tokens_micros_per_1k").notNull().default(600),
  customerMarkupMultiplier: numeric("customer_markup_multiplier", { precision: 5, scale: 2 }).notNull().default("1.50"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AiModelPricingMetadataRow = typeof aiModelPricingMetadataTable.$inferSelect;

export const couponsTable = pgTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percent"), // percent | fixed
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull(),
  maxRedemptions: integer("max_redemptions"),
  timesRedeemed: integer("times_redeemed").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CouponRow = typeof couponsTable.$inferSelect;

export const invoiceSequencesTable = pgTable("invoice_sequences", {
  year: integer("year").primaryKey(),
  lastValue: integer("last_value").notNull().default(0),
});

export type InvoiceSequenceRow = typeof invoiceSequencesTable.$inferSelect;

export const billingEventsTable = pgTable(
  "billing_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stripeEventId: text("stripe_event_id").unique(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").default({}),
    processed: boolean("processed").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("billing_events_type_idx").on(t.eventType)]
);

export type BillingEventRow = typeof billingEventsTable.$inferSelect;

export const paymentProviderConfigTable = pgTable("payment_provider_config", {
  id: text("id").primaryKey().default("stripe"),
  enabled: boolean("enabled").notNull().default(true),
  mode: text("mode").notNull().default("test"), // test | live
  publishableKey: text("publishable_key"),
  secretKey: text("secret_key"),
  webhookSecret: text("webhook_secret"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PaymentProviderConfigRow = typeof paymentProviderConfigTable.$inferSelect;
