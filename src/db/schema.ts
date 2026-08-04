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

// ── Application Users ───────────────────────────────────────────────────────
export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").unique(),
    role: text("role").notNull().default("user"), // "user" | "admin" | "superadmin"
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role)]
);

export type UserRow = typeof usersTable.$inferSelect;

// ── Organizations ────────────────────────────────────────────────────────────
export const organizationsTable = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    ownerId: text("owner_id").notNull().references(() => usersTable.id, { onDelete: "restrict" }),
    plan: text("plan").notNull().default("business"),
    maxSeats: integer("max_seats").notNull().default(10),
    status: text("status").notNull().default("active"),
    // Saudi Billing Identity & Organization Details
    legalName: text("legal_name"),
    vatNumber: text("vat_number"),
    crNumber: text("cr_number"),
    taxIdentificationNumber: text("tax_identification_number"),
    billingAddress: text("billing_address"),
    country: text("country").notNull().default("SA"),
    scheduledPlan: text("scheduled_plan"),
    scheduledPlanEffectiveAt: timestamp("scheduled_plan_effective_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("organizations_owner_idx").on(t.ownerId)]
);

export type OrganizationRow = typeof organizationsTable.$inferSelect;

export const organizationMembersTable = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // owner | admin | member
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("org_members_user_org_uniq").on(t.orgId, t.userId),
    index("org_members_org_idx").on(t.orgId),
    index("org_members_user_idx").on(t.userId),
  ]
);

export type OrganizationMemberRow = typeof organizationMembersTable.$inferSelect;

// ── Emergency Actions Audit Log (KillSwitch) ───────────────────────────────
export const emergencyActionsLogTable = pgTable(
  "emergency_actions_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminUserId: text("admin_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    adminEmail: text("admin_email"),
    actionType: text("action_type").notNull(), // "activated" | "deactivated"
    direction: text("direction").notNull(),
    stateKey: text("state_key").notNull(),
    targetLabel: text("target_label").notNull(),
    previousValue: text("previous_value"),
    newValue: text("new_value").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("emergency_actions_log_admin_idx").on(t.adminUserId),
    index("emergency_actions_log_created_at_idx").on(t.createdAt),
  ]
);

export type EmergencyActionLog = typeof emergencyActionsLogTable.$inferSelect;

// ── System State KV Store (KillSwitches, Maintenance Mode, Configs) ─────────
export const systemStateTable = pgTable("system_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SystemState = typeof systemStateTable.$inferSelect;

// ── Platform Health Snapshots (Monitoring) ───────────────────────────────
export const platformHealthSnapshotsTable = pgTable(
  "platform_health_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    overallStatus: text("overall_status").notNull(), // "healthy" | "degraded" | "unhealthy"
    latencyMs: integer("latency_ms").notNull().default(0),
    checks: jsonb("checks").notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("platform_health_snapshots_created_at_idx").on(t.createdAt)]
);

export type PlatformHealthSnapshot = typeof platformHealthSnapshotsTable.$inferSelect;

// ── Operational Alert Configs ───────────────────────────────────────────────
export const operationalAlertConfigsTable = pgTable("operational_alert_configs", {
  id: text("id").primaryKey(),
  metric: text("metric").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  thresholdValue: real("threshold_value").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  notifyInApp: boolean("notify_in_app").notNull().default(true),
  cooldownMinutes: integer("cooldown_minutes").notNull().default(15),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type OperationalAlertConfig = typeof operationalAlertConfigsTable.$inferSelect;

// ── Operational Alert Incidents ─────────────────────────────────────────────
export const operationalAlertIncidentsTable = pgTable(
  "operational_alert_incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alertConfigId: text("alert_config_id").notNull().references(() => operationalAlertConfigsTable.id, { onDelete: "cascade" }),
    metric: text("metric").notNull(),
    currentValue: real("current_value").notNull(),
    thresholdValue: real("threshold_value").notNull(),
    status: text("status").notNull().default("open"), // "open" | "resolved"
    message: text("message").notNull(),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("operational_alert_incidents_config_idx").on(t.alertConfigId),
    index("operational_alert_incidents_status_idx").on(t.status),
    index("operational_alert_incidents_created_at_idx").on(t.createdAt),
  ]
);

export type OperationalAlertIncident = typeof operationalAlertIncidentsTable.$inferSelect;

// ── Audit Logs (Project / General Audit) ────────────────────────────────────
export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: text("project_id"),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_org_idx").on(t.orgId),
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

export type AuditLogRow = typeof auditLogsTable.$inferSelect;

// ── Audit Events (Org / Enterprise Scope) ──────────────────────────────────
export const auditEventsTable = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_events_org_idx").on(t.orgId),
    index("audit_events_actor_idx").on(t.actorId),
    index("audit_events_created_at_idx").on(t.createdAt),
  ]
);

export type AuditEventRow = typeof auditEventsTable.$inferSelect;

// ── Cost Guard Settings ─────────────────────────────────────────────────────
export const costGuardSettingsTable = pgTable("cost_guard_settings", {
  id: text("id").primaryKey().default("default"),
  orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  maxDailyUsd: numeric("max_daily_usd", { precision: 12, scale: 2 }).notNull().default("50.00"),
  maxMonthlyUsd: numeric("max_monthly_usd", { precision: 12, scale: 2 }).notNull().default("1000.00"),
  autoKillAtUsd: numeric("auto_kill_at_usd", { precision: 12, scale: 2 }).notNull().default("1500.00"),
  notifyAtPercentage: integer("notify_at_percentage").notNull().default(80),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CostGuardSettingsRow = typeof costGuardSettingsTable.$inferSelect;

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
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
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

// ── Phase 3: AI Wallet & Usage ─────────────────────────────────────────────
export const aiWalletBalancesTable = pgTable(
  "ai_wallet_balances",
  {
    userId: text("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    includedCreditMicros: integer("included_credit_micros").notNull().default(10000000), // $10.00 initial
    walletMicros: integer("wallet_micros").notNull().default(5000000), // $5.00 initial
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("ai_wallet_balances_org_idx").on(t.orgId)]
);

export type AiWalletBalanceRow = typeof aiWalletBalancesTable.$inferSelect;

export const aiWalletLedgerTable = pgTable(
  "ai_wallet_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    amountMicros: integer("amount_micros").notNull(), // positive = credit, negative = debit
    type: text("type").notNull(), // "topup" | "usage" | "admin_adjustment" | "monthly_reset"
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ai_wallet_ledger_user_idx").on(t.userId),
    index("ai_wallet_ledger_org_idx").on(t.orgId),
    index("ai_wallet_ledger_created_idx").on(t.createdAt),
  ]
);

export type AiWalletLedgerRow = typeof aiWalletLedgerTable.$inferSelect;

export const aiUsageEventsTable = pgTable(
  "ai_usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    productSlug: text("product_slug").notNull().default("oprox-code"),
    provider: text("provider").notNull(), // gemini | openai | anthropic
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    costMicros: integer("cost_micros").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ai_usage_user_idx").on(t.userId),
    index("ai_usage_org_idx").on(t.orgId),
    index("ai_usage_product_idx").on(t.productSlug),
    index("ai_usage_created_idx").on(t.createdAt),
  ]
);

export type AiUsageEventRow = typeof aiUsageEventsTable.$inferSelect;

export const aiWalletReservationsTable = pgTable(
  "ai_wallet_reservations",
  {
    id: text("id").primaryKey(), // res_xxx
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    reservedMicros: integer("reserved_micros").notNull(),
    status: text("status").notNull().default("reserved"), // reserved | finalized | rolled_back
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("ai_wallet_reservations_user_idx").on(t.userId),
    index("ai_wallet_reservations_status_idx").on(t.status),
  ]
);

export type AiWalletReservationRow = typeof aiWalletReservationsTable.$inferSelect;

export const aiProviderConfigsTable = pgTable("ai_provider_configs", {
  providerId: text("provider_id").primaryKey(), // gemini | openai | anthropic
  displayName: text("display_name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  priority: integer("priority").notNull().default(1),
  circuitBreakerOpen: boolean("circuit_breaker_open").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AiProviderConfigRow = typeof aiProviderConfigsTable.$inferSelect;

// ── Phase 5: Central Operations (Queues, Background Jobs) ──────────────────
export const jobQueueAuditTable = pgTable(
  "job_queue_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    queueName: text("queue_name").notNull(),
    jobName: text("job_name").notNull(),
    status: text("status").notNull().default("completed"), // waiting | active | completed | failed | dlq
    attempts: integer("attempts").notNull().default(1),
    payload: jsonb("payload").default({}),
    errorMsg: text("error_msg"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("job_queue_created_idx").on(t.createdAt),
    index("job_queue_status_idx").on(t.status),
  ]
);

export type JobQueueAuditRow = typeof jobQueueAuditTable.$inferSelect;

// ── Phase 6: Product Registry (Central Ecosystem Control) ──────────────────
export const productRegistryTable = pgTable("product_registry", {
  id: text("id").primaryKey(), // oprox-website | oprox-code | oprox-studio | oprox-properties | oprox-pms
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("operational"), // operational | degraded | maintenance | offline
  environment: text("environment").notNull().default("production"),
  apiIdentifier: text("api_identifier").notNull(),
  health: text("health").notNull().default("healthy"),
  activeUsersCount: integer("active_users_count").notNull().default(0),
  activeSubscriptionsCount: integer("active_subscriptions_count").notNull().default(0),
  monthlyAiCostUsd: numeric("monthly_ai_cost_usd", { precision: 12, scale: 2 }).notNull().default("0.00"),
  lastHeartbeat: timestamp("last_heartbeat").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductRegistryRow = typeof productRegistryTable.$inferSelect;

// ── Phase 3: Execution State Persistence ────────────────────────────────────
export const phase3ProjectConfigsTable = pgTable("phase3_project_configs", {
  tenantId: text("tenant_id").primaryKey(),
  projectName: text("project_name").notNull(),
  description: text("description"),
  template: text("template").notNull(),
  architecture: text("architecture").notNull(),
  techStack: text("tech_stack").notNull(),
  database: text("database").notNull(),
  auth: text("auth").notNull(),
  deploymentTarget: text("deployment_target").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Phase3ProjectConfigRow = typeof phase3ProjectConfigsTable.$inferSelect;

export const phase3GeneratedFilesTable = pgTable(
  "phase3_generated_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    path: text("path").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("phase3_generated_files_tenant_idx").on(t.tenantId)]
);

export type Phase3GeneratedFileRow = typeof phase3GeneratedFilesTable.$inferSelect;

export const phase3SharedContextTable = pgTable("phase3_shared_context", {
  tenantId: text("tenant_id").primaryKey(),
  architectureDoc: text("architecture_doc").notNull(),
  dbSchemaState: text("db_schema_state").notNull(),
  activeEndpoints: text("active_endpoints").notNull(),
  frontendViews: text("frontend_views").notNull(),
  qaPassRate: text("qa_pass_rate").notNull(),
  securityAudit: text("security_audit").notNull(),
  containerState: text("container_state").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Phase3SharedContextRow = typeof phase3SharedContextTable.$inferSelect;

export const phase3AgentHandoffsTable = pgTable(
  "phase3_agent_handoffs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    fromAgent: text("from_agent").notNull(),
    toAgent: text("to_agent").notNull(),
    taskTitle: text("task_title").notNull(),
    outputSummary: text("output_summary").notNull(),
    fullOutput: text("full_output"),
    timestamp: text("timestamp").notNull(),
    status: text("status").notNull().default("passed"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("phase3_agent_handoffs_tenant_idx").on(t.tenantId)]
);

export type Phase3AgentHandoffRow = typeof phase3AgentHandoffsTable.$inferSelect;

export const phase3PipelineTasksTable = pgTable(
  "phase3_pipeline_tasks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    title: text("title").notNull(),
    assignedAgent: text("assigned_agent").notNull(),
    executionType: text("execution_type").notNull().default("GENERIC"),
    dependencies: jsonb("dependencies").notNull().default([]),
    status: text("status").notNull().default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    input: text("input"),
    output: text("output"),
    error: text("error"),
    completedAt: text("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("phase3_pipeline_tasks_tenant_idx").on(t.tenantId)]
);

export type Phase3PipelineTaskRow = typeof phase3PipelineTasksTable.$inferSelect;

export const phase3ReleasesTable = pgTable(
  "phase3_releases",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    version: text("version").notNull(),
    semverType: text("semver_type").notNull().default("minor"),
    releaseNotes: text("release_notes").notNull(),
    readinessScore: integer("readiness_score").notNull().default(0),
    goNoGo: text("go_no_go").notNull().default("NO-GO"),
    checklist: jsonb("checklist").notNull().default([]),
    status: text("status").notNull().default("approved"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("phase3_releases_tenant_idx").on(t.tenantId)]
);

export type Phase3ReleaseRow = typeof phase3ReleasesTable.$inferSelect;

export const phase3LifecycleTable = pgTable("phase3_lifecycle", {
  tenantId: text("tenant_id").primaryKey(),
  currentStage: text("current_stage").notNull().default("idea"),
  stageOutputs: jsonb("stage_outputs").notNull().default({}),
  history: jsonb("history").notNull().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Phase3LifecycleRow = typeof phase3LifecycleTable.$inferSelect;

// ── Phase 4: Production Delivery, Deployment & Governance ─────────────────
export const phase4DeploymentConfigsTable = pgTable("phase4_deployment_configs", {
  tenantId: text("tenant_id").primaryKey(),
  provider: text("provider").notNull().default("cloudrun"), // cloudrun | vercel | docker | custom
  environment: text("environment").notNull().default("production"), // development | preview | staging | production
  deploymentTarget: text("deployment_target").notNull().default("cloudrun"),
  buildSettings: jsonb("build_settings").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Phase4DeploymentConfigRow = typeof phase4DeploymentConfigsTable.$inferSelect;

export const phase4DeploymentsTable = pgTable(
  "phase4_deployments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    releaseVersion: text("release_version").notNull(),
    gitSha: text("git_sha").notNull(),
    provider: text("provider").notNull(),
    status: text("status").notNull().default("NOT_CONFIGURED"), // NOT_CONFIGURED | DEPLOYING | VERIFYING | HEALTHY | DEGRADED | FAILED | CANCELLED
    logs: jsonb("logs").notNull().default([]),
    initiatedBy: text("initiated_by").notNull(),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    failureReason: text("failure_reason"),
  },
  (t) => [
    index("phase4_deployments_tenant_idx").on(t.tenantId),
    index("phase4_deployments_status_idx").on(t.status),
  ]
);

export type Phase4DeploymentRow = typeof phase4DeploymentsTable.$inferSelect;

export const phase4RevisionsTable = pgTable(
  "phase4_revisions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    revisionId: text("revision_id").notNull(),
    gitSha: text("git_sha").notNull(),
    imageTag: text("image_tag"),
    status: text("status").notNull().default("active"),
    isKnownGood: boolean("is_known_good").notNull().default(false),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("phase4_revisions_tenant_idx").on(t.tenantId)]
);

export type Phase4RevisionRow = typeof phase4RevisionsTable.$inferSelect;

export const phase4ReleaseGatesTable = pgTable(
  "phase4_release_gates",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    gitSha: text("git_sha").notNull(),
    decision: text("decision").notNull().default("NO_GO"), // GO | NO_GO | NOT_CONFIGURED
    blockingReasons: jsonb("blocking_reasons").notNull().default([]),
    checks: jsonb("checks").notNull().default({}),
    evaluatedAt: timestamp("evaluated_at").notNull().defaultNow(),
  },
  (t) => [index("phase4_release_gates_tenant_idx").on(t.tenantId)]
);

export type Phase4ReleaseGateRow = typeof phase4ReleaseGatesTable.$inferSelect;

export const phase4HealthChecksTable = pgTable(
  "phase4_health_checks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    endpoint: text("endpoint").notNull(),
    status: text("status").notNull().default("NOT_MEASURED"), // HEALTHY | DEGRADED | FAILED | NOT_MEASURED | NOT_CONFIGURED
    httpCode: integer("http_code"),
    latencyMs: integer("latency_ms"),
    details: jsonb("details").notNull().default({}),
    checkedAt: timestamp("checked_at").notNull().defaultNow(),
  },
  (t) => [index("phase4_health_checks_tenant_idx").on(t.tenantId)]
);

export type Phase4HealthCheckRow = typeof phase4HealthChecksTable.$inferSelect;

export const phase4MigrationHistoryTable = pgTable(
  "phase4_migration_history",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    environment: text("environment").notNull().default("production"),
    migrationName: text("migration_name").notNull(),
    isDestructive: boolean("is_destructive").notNull().default(false),
    actorId: text("actor_id").notNull(),
    confirmedBy: text("confirmed_by"),
    status: text("status").notNull().default("APPLIED"), // APPLIED | BLOCKED | REVERTED | FAILED
    executedAt: timestamp("executed_at").notNull().defaultNow(),
  },
  (t) => [index("phase4_migration_history_tenant_idx").on(t.tenantId)]
);

export type Phase4MigrationHistoryRow = typeof phase4MigrationHistoryTable.$inferSelect;

export const phase4IncidentsTable = pgTable(
  "phase4_incidents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    failureCategory: text("failure_category").notNull(), // BUILD_FAILURE | TEST_FAILURE | SECURITY_GATE_FAILURE | MIGRATION_FAILURE | DEPLOYMENT_FAILURE | HEALTH_CHECK_FAILURE | SMOKE_TEST_FAILURE | PROVIDER_FAILURE | CONFIGURATION_FAILURE
    summary: text("summary").notNull(),
    evidence: jsonb("evidence").notNull().default({}),
    status: text("status").notNull().default("OPEN"), // OPEN | INVESTIGATING | RESOLVED | MITIGATED
    remediation: text("remediation"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (t) => [index("phase4_incidents_tenant_idx").on(t.tenantId)]
);

export type Phase4IncidentRow = typeof phase4IncidentsTable.$inferSelect;

export const phase4RollbacksTable = pgTable(
  "phase4_rollbacks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    targetRevisionId: text("target_revision_id").notNull(),
    fromRevisionId: text("from_revision_id").notNull(),
    reason: text("reason").notNull(),
    initiatedBy: text("initiated_by").notNull(),
    status: text("status").notNull().default("EXECUTED"), // EXECUTED | FAILED | REJECTED
    verificationResult: text("verification_result").notNull().default("NOT_VERIFIED"), // HEALTHY | DEGRADED | FAILED | NOT_VERIFIED
    executedAt: timestamp("executed_at").notNull().defaultNow(),
  },
  (t) => [index("phase4_rollbacks_tenant_idx").on(t.tenantId)]
);

export type Phase4RollbackRow = typeof phase4RollbacksTable.$inferSelect;

export const phase4EnvConfigsTable = pgTable(
  "phase4_env_configs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    environment: text("environment").notNull().default("production"), // development | preview | staging | production
    varKey: text("var_key").notNull(),
    status: text("status").notNull().default("CONFIGURED"), // CONFIGURED | MISSING | INVALID_REFERENCE
    isRequired: boolean("is_required").notNull().default(true),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("phase4_env_tenant_env_key_uniq").on(t.tenantId, t.environment, t.varKey),
    index("phase4_env_tenant_idx").on(t.tenantId),
  ]
);

export type Phase4EnvConfigRow = typeof phase4EnvConfigsTable.$inferSelect;

// ── Phase 5: Enterprise Collaboration, Governed Autonomy & Software Delivery ─

export const phase5TeamsTable = pgTable(
  "phase5_teams",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("phase5_teams_tenant_idx").on(t.tenantId)]
);

export type Phase5TeamRow = typeof phase5TeamsTable.$inferSelect;

export const phase5MembershipsTable = pgTable(
  "phase5_memberships",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    userId: text("user_id").notNull(),
    teamId: text("team_id"),
    projectId: text("project_id"),
    workspaceId: text("workspace_id"),
    roles: jsonb("roles").notNull().default([]),
    permissions: jsonb("permissions").notNull().default([]),
    status: text("status").notNull().default("active"), // active | suspended
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("phase5_memberships_tenant_idx").on(t.tenantId),
    index("phase5_memberships_user_idx").on(t.userId),
  ]
);

export type Phase5MembershipRow = typeof phase5MembershipsTable.$inferSelect;

export const phase5WorkspacesTable = pgTable(
  "phase5_workspaces",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    name: text("name").notNull(),
    ownerId: text("owner_id").notNull(),
    environment: text("environment").notNull().default("development"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("phase5_workspaces_tenant_idx").on(t.tenantId)]
);

export type Phase5WorkspaceRow = typeof phase5WorkspacesTable.$inferSelect;

export const phase5ChangeRequestsTable = pgTable(
  "phase5_change_requests",
  {
    id: text("id").primaryKey(), // cr_xxx
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    authorId: text("author_id").notNull(),
    authorType: text("author_type").notNull().default("user"), // user | ai_agent
    sourceBranch: text("source_branch").notNull().default("feature"),
    targetBranch: text("target_branch").notNull().default("main"),
    title: text("title").notNull(),
    description: text("description"),
    filesChanged: jsonb("files_changed").notNull().default([]),
    diffMetadata: jsonb("diff_metadata").notNull().default({}),
    riskClassification: text("risk_classification").notNull().default("LOW"), // LOW | MEDIUM | HIGH | CRITICAL
    riskReasons: jsonb("risk_reasons").notNull().default([]),
    status: text("status").notNull().default("OPEN"), // DRAFT | OPEN | IN_REVIEW | CHANGES_REQUESTED | APPROVED | REJECTED | MERGED | CANCELLED | BLOCKED
    aiProposalMeta: jsonb("ai_proposal_meta").notNull().default({}),
    contentHash: text("content_hash"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("phase5_cr_tenant_idx").on(t.tenantId),
    index("phase5_cr_status_idx").on(t.status),
  ]
);

export type Phase5ChangeRequestRow = typeof phase5ChangeRequestsTable.$inferSelect;

export const phase5ApprovalsTable = pgTable(
  "phase5_approvals",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    changeRequestId: text("change_request_id").notNull(),
    approverId: text("approver_id").notNull(),
    approverRole: text("approver_role"),
    decision: text("decision").notNull(), // APPROVED | REJECTED
    comment: text("comment"),
    policyEvaluated: text("policy_evaluated"),
    approvedContentHash: text("approved_content_hash").notNull(),
    status: text("status").notNull().default("VALID"), // VALID | INVALIDATED
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("phase5_approvals_tenant_idx").on(t.tenantId),
    index("phase5_approvals_cr_idx").on(t.changeRequestId),
  ]
);

export type Phase5ApprovalRow = typeof phase5ApprovalsTable.$inferSelect;

export const phase5ReviewsCommentsTable = pgTable(
  "phase5_reviews_comments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    changeRequestId: text("change_request_id").notNull(),
    authorId: text("author_id").notNull(),
    type: text("type").notNull().default("comment"), // comment | review_summary | line_comment
    filePath: text("file_path"),
    lineNumber: integer("line_number"),
    content: text("content").notNull(),
    resolved: boolean("resolved").notNull().default(false),
    resolvedBy: text("resolved_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("phase5_comments_tenant_idx").on(t.tenantId),
    index("phase5_comments_cr_idx").on(t.changeRequestId),
  ]
);

export type Phase5ReviewCommentRow = typeof phase5ReviewsCommentsTable.$inferSelect;

export const phase5CodeOwnersTable = pgTable(
  "phase5_code_owners",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    pathPattern: text("path_pattern").notNull(),
    ownerType: text("owner_type").notNull(), // team | role | member
    ownerTarget: text("owner_target").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("phase5_code_owners_tenant_idx").on(t.tenantId)]
);

export type Phase5CodeOwnerRow = typeof phase5CodeOwnersTable.$inferSelect;

export const phase5PoliciesTable = pgTable(
  "phase5_policies",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id"),
    policyType: text("policy_type").notNull(), // DEVELOPMENT_GOVERNANCE | PROTECTED_ENVIRONMENT | AUTONOMY
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(true),
    config: jsonb("config").notNull().default({}),
    authorId: text("author_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    activatedAt: timestamp("activated_at"),
  },
  (t) => [index("phase5_policies_tenant_idx").on(t.tenantId)]
);

export type Phase5PolicyRow = typeof phase5PoliciesTable.$inferSelect;

export const phase5AutonomyConfigTable = pgTable("phase5_autonomy_config", {
  tenantId: text("tenant_id").primaryKey(),
  autonomyLevel: integer("autonomy_level").notNull().default(2), // 0 to 4
  allowSelfEdit: boolean("allow_self_edit").notNull().default(false),
  maxAiCostPerTaskUsd: numeric("max_ai_cost_per_task_usd", { precision: 12, scale: 2 }).notNull().default("5.00"),
  requireApprovalForHighRisk: boolean("require_approval_for_high_risk").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Phase5AutonomyConfigRow = typeof phase5AutonomyConfigTable.$inferSelect;

export const phase5EventsTable = pgTable(
  "phase5_events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id"),
    actorId: text("actor_id").notNull(),
    actorType: text("actor_type").notNull().default("user"), // user | ai_agent | system
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    risk: text("risk").notNull().default("LOW"),
    details: jsonb("details").notNull().default({}),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (t) => [
    index("phase5_events_tenant_idx").on(t.tenantId),
    index("phase5_events_action_idx").on(t.action),
  ]
);

export type Phase5EventRow = typeof phase5EventsTable.$inferSelect;

// ── Phase 6 Production Repository, CI/CD & Delivery Tables ──────────

export const phase6RepositoryConnectionsTable = pgTable(
  "phase6_repository_connections",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id"),
    provider: text("provider").notNull(), // github | gitlab | bitbucket | git
    repoIdentifier: text("repo_identifier").notNull(), // owner/repo or path
    repoOwner: text("repo_owner").notNull(),
    defaultBranch: text("default_branch").notNull().default("main"),
    connectionStatus: text("connection_status").notNull().default("CONFIGURED"), // CONFIGURED | NOT_CONFIGURED | UNSUPPORTED | FAILED
    accountRef: text("account_ref"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastVerifiedAt: timestamp("last_verified_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_repo_conn_tenant_idx").on(t.tenantId),
    index("p6_repo_conn_provider_idx").on(t.provider),
  ]
);

export type Phase6RepositoryConnectionRow = typeof phase6RepositoryConnectionsTable.$inferSelect;

export const phase6RepositoryBranchesTable = pgTable(
  "phase6_repository_branches",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    repoId: text("repo_id").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull().default("feature"), // feature | ai_task | repair | release | hotfix
    ownerId: text("owner_id").notNull(),
    originatingTaskId: text("originating_task_id"),
    changeRequestId: text("change_request_id"),
    baseSha: text("base_sha").notNull(),
    headSha: text("head_sha").notNull(),
    status: text("status").notNull().default("active"), // active | merged | closed
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_repo_branch_tenant_idx").on(t.tenantId),
    index("p6_repo_branch_repo_idx").on(t.repoId),
  ]
);

export type Phase6RepositoryBranchRow = typeof phase6RepositoryBranchesTable.$inferSelect;

export const phase6CommitProvenanceTable = pgTable(
  "phase6_commit_provenance",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    repoId: text("repo_id").notNull(),
    commitSha: text("commit_sha").notNull(),
    authorType: text("author_type").notNull().default("human"), // human | ai_generated | ai_assisted
    authorId: text("author_id").notNull(),
    requirementId: text("requirement_id"),
    aiTaskId: text("ai_task_id"),
    agentId: text("agent_id"),
    workspaceId: text("workspace_id"),
    branchName: text("branch_name").notNull(),
    changeRequestId: text("change_request_id"),
    riskLevel: text("risk_level").notNull().default("LOW"),
    testStatus: text("test_status").notNull().default("NOT_RUN"),
    securityReviewStatus: text("security_review_status").notNull().default("PASSED"),
    approvalStatus: text("approval_status").notNull().default("APPROVED"),
    aiCostUsd: numeric("ai_cost_usd", { precision: 12, scale: 4 }).notNull().default("0.0000"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_commit_prov_tenant_idx").on(t.tenantId),
    index("p6_commit_prov_sha_idx").on(t.commitSha),
  ]
);

export type Phase6CommitProvenanceRow = typeof phase6CommitProvenanceTable.$inferSelect;

export const phase6CiPipelineDefinitionsTable = pgTable(
  "phase6_ci_pipeline_definitions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    name: text("name").notNull(),
    stages: jsonb("stages").notNull().default([]),
    allowlistedCommands: jsonb("allowlisted_commands").notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_ci_def_tenant_idx").on(t.tenantId),
  ]
);

export type Phase6CiPipelineDefinitionRow = typeof phase6CiPipelineDefinitionsTable.$inferSelect;

export const phase6CiPipelineRunsTable = pgTable(
  "phase6_ci_pipeline_runs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    repoId: text("repo_id").notNull(),
    pipelineId: text("pipeline_id").notNull(),
    commitSha: text("commit_sha").notNull(),
    branchName: text("branch_name").notNull(),
    trigger: text("trigger").notNull().default("manual"), // manual | push | change_request | ai_repair
    status: text("status").notNull().default("PENDING"), // PENDING | RUNNING | PASSED | FAILED | CANCELLED
    stageResults: jsonb("stage_results").notNull().default([]),
    durationMs: integer("duration_ms").notNull().default(0),
    artifacts: jsonb("artifacts").notNull().default([]),
    failureEvidence: jsonb("failure_evidence").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    finishedAt: timestamp("finished_at"),
  },
  (t) => [
    index("p6_ci_run_tenant_idx").on(t.tenantId),
    index("p6_ci_run_repo_idx").on(t.repoId),
  ]
);

export type Phase6CiPipelineRunRow = typeof phase6CiPipelineRunsTable.$inferSelect;

export const phase6BuildArtifactsTable = pgTable(
  "phase6_build_artifacts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    repoId: text("repo_id").notNull(),
    pipelineRunId: text("pipeline_run_id").notNull(),
    commitSha: text("commit_sha").notNull(),
    artifactType: text("artifact_type").notNull(), // frontend_bundle | server_bundle | container_image | test_report
    name: text("name").notNull(),
    checksumSha256: text("checksum_sha256").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    storageRef: text("storage_ref").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_artifact_tenant_idx").on(t.tenantId),
    index("p6_artifact_sha_idx").on(t.commitSha),
  ]
);

export type Phase6BuildArtifactRow = typeof phase6BuildArtifactsTable.$inferSelect;

export const phase6DevEnvironmentsTable = pgTable(
  "phase6_dev_environments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    name: text("name").notNull(),
    branchName: text("branch_name").notNull(),
    commitSha: text("commit_sha").notNull(),
    provider: text("provider").notNull().default("local_runner"),
    status: text("status").notNull().default("REQUESTED"), // REQUESTED | PROVISIONING | READY | BUSY | STOPPING | STOPPED | FAILED | EXPIRED
    resourceRef: text("resource_ref"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (t) => [
    index("p6_dev_env_tenant_idx").on(t.tenantId),
  ]
);

export type Phase6DevEnvironmentRow = typeof phase6DevEnvironmentsTable.$inferSelect;

export const phase6PreviewEnvironmentsTable = pgTable(
  "phase6_preview_environments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    changeRequestId: text("change_request_id").notNull(),
    commitSha: text("commit_sha").notNull(),
    previewUrl: text("preview_url"),
    status: text("status").notNull().default("REQUESTED"), // REQUESTED | PROVISIONING | READY | FAILED | EXPIRED
    healthStatus: text("health_status").notNull().default("UNKNOWN"), // UNKNOWN | HEALTHY | UNHEALTHY
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (t) => [
    index("p6_preview_env_tenant_idx").on(t.tenantId),
    index("p6_preview_env_cr_idx").on(t.changeRequestId),
  ]
);

export type Phase6PreviewEnvironmentRow = typeof phase6PreviewEnvironmentsTable.$inferSelect;

export const phase6ProviderEventsTable = pgTable(
  "phase6_provider_events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    provider: text("provider").notNull(),
    eventType: text("event_type").notNull(),
    repoIdentifier: text("repo_identifier").notNull(),
    payload: jsonb("payload").notNull().default({}),
    signatureVerified: boolean("signature_verified").notNull().default(false),
    processed: boolean("processed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_prov_evt_tenant_idx").on(t.tenantId),
  ]
);

export type Phase6ProviderEventRow = typeof phase6ProviderEventsTable.$inferSelect;

export const phase6OperationLocksTable = pgTable(
  "phase6_operation_locks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    lockKey: text("lock_key").notNull(),
    lockedBy: text("locked_by").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => [
    uniqueIndex("p6_lock_tenant_key_idx").on(t.tenantId, t.lockKey),
  ]
);

export type Phase6OperationLockRow = typeof phase6OperationLocksTable.$inferSelect;

// ── OPROX Studio Phase 1: Visual Builder & Low-Code Engine Tables ───────────

export const oproxStudioProjectsTable = pgTable(
  "oprox_studio_projects",
  {
    id: text("id").primaryKey(), // proj_xxx
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    framework: text("framework").notNull().default("react_tailwind"),
    theme: text("theme").notNull().default("dark_modern"),
    defaultPageId: text("default_page_id").notNull().default("page_main"),
    activeRevisionNumber: integer("active_revision_number").notNull().default(1),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_proj_tenant_idx").on(t.tenantId),
    index("studio_proj_org_idx").on(t.orgId),
  ]
);

export type OproxStudioProjectRow = typeof oproxStudioProjectsTable.$inferSelect;

export const oproxStudioCanvasesTable = pgTable(
  "oprox_studio_canvases",
  {
    id: text("id").primaryKey(), // canvas_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    pageId: text("page_id").notNull(),
    pageName: text("page_name").notNull(),
    pagePath: text("page_path").notNull(),
    ir: jsonb("ir").notNull().default({}),
    revisionNumber: integer("revision_number").notNull().default(1),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_canvas_tenant_idx").on(t.tenantId),
    index("studio_canvas_proj_idx").on(t.projectId),
    uniqueIndex("studio_canvas_proj_page_uniq").on(t.projectId, t.pageId),
  ]
);

export type OproxStudioCanvasRow = typeof oproxStudioCanvasesTable.$inferSelect;

export const oproxStudioDesignTokensTable = pgTable(
  "oprox_studio_design_tokens",
  {
    id: text("id").primaryKey(), // dt_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    tokens: jsonb("tokens").notNull().default({}),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_tokens_tenant_idx").on(t.tenantId),
    uniqueIndex("studio_tokens_proj_uniq").on(t.projectId),
  ]
);

export type OproxStudioDesignTokenRow = typeof oproxStudioDesignTokensTable.$inferSelect;

export const oproxStudioComponentsTable = pgTable(
  "oprox_studio_components",
  {
    id: text("id").primaryKey(), // comp_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("CUSTOM"),
    irNode: jsonb("ir_node").notNull().default({}),
    isGlobal: boolean("is_global").notNull().default(false),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_comp_tenant_idx").on(t.tenantId),
    index("studio_comp_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioComponentRow = typeof oproxStudioComponentsTable.$inferSelect;

export const oproxStudioSchemasTable = pgTable(
  "oprox_studio_schemas",
  {
    id: text("id").primaryKey(), // schema_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    schemaModel: jsonb("schema_model").notNull().default({ tables: [] }),
    generatedDrizzleCode: text("generated_drizzle_code"),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_schema_tenant_idx").on(t.tenantId),
    uniqueIndex("studio_schema_proj_uniq").on(t.projectId),
  ]
);

export type OproxStudioSchemaRow = typeof oproxStudioSchemasTable.$inferSelect;

export const oproxStudioFlowsTable = pgTable(
  "oprox_studio_flows",
  {
    id: text("id").primaryKey(), // flow_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    flowGraph: jsonb("flow_graph").notNull().default({ nodes: [], edges: [] }),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_flow_tenant_idx").on(t.tenantId),
    uniqueIndex("studio_flow_proj_uniq").on(t.projectId),
  ]
);

export type OproxStudioFlowRow = typeof oproxStudioFlowsTable.$inferSelect;

export const oproxStudioRevisionsTable = pgTable(
  "oprox_studio_revisions",
  {
    id: text("id").primaryKey(), // rev_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    authorId: text("author_id").notNull(),
    irSnapshot: jsonb("ir_snapshot").notNull().default({}),
    changeSummary: text("change_summary").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_rev_tenant_idx").on(t.tenantId),
    index("studio_rev_proj_idx").on(t.projectId),
    uniqueIndex("studio_rev_proj_num_uniq").on(t.projectId, t.revisionNumber),
  ]
);

export type OproxStudioRevisionRow = typeof oproxStudioRevisionsTable.$inferSelect;

export const oproxStudioPromotionsTable = pgTable(
  "oprox_studio_promotions",
  {
    id: text("id").primaryKey(), // promo_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    targetBranch: text("target_branch").notNull().default("feature/studio-build"),
    changeRequestId: text("change_request_id"),
    commitSha: text("commit_sha"),
    status: text("status").notNull().default("PROMOTED"), // PROMOTED | PENDING_APPROVAL | FAILED
    promotedBy: text("promoted_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_promo_tenant_idx").on(t.tenantId),
    index("studio_promo_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioPromotionRow = typeof oproxStudioPromotionsTable.$inferSelect;

export const oproxStudioAssetsTable = pgTable(
  "oprox_studio_assets",
  {
    id: text("id").primaryKey(), // asset_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    storageUrl: text("storage_url").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_assets_tenant_idx").on(t.tenantId),
    index("studio_assets_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioAssetRow = typeof oproxStudioAssetsTable.$inferSelect;

export const oproxStudioDataSourcesTable = pgTable(
  "oprox_studio_data_sources",
  {
    id: text("id").primaryKey(), // ds_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    method: text("method").notNull().default("GET"),
    url: text("url").notNull(),
    headersJson: jsonb("headers_json").notNull().default({}),
    paramsJson: jsonb("params_json").notNull().default({}),
    reqSchemaJson: jsonb("req_schema_json").notNull().default({}),
    resSchemaJson: jsonb("res_schema_json").notNull().default({}),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_ds_tenant_idx").on(t.tenantId),
    index("studio_ds_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioDataSourceRow = typeof oproxStudioDataSourcesTable.$inferSelect;

export const oproxStudioSyncProvenanceTable = pgTable(
  "oprox_studio_sync_provenance",
  {
    id: text("id").primaryKey(), // sync_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    regionId: text("region_id").notNull(),
    regionType: text("region_type").notNull().default("STUDIO_MANAGED"), // STUDIO_MANAGED | CUSTOM_PROTECTED | UNSUPPORTED
    codeHash: text("code_hash").notNull(),
    irHash: text("ir_hash").notNull(),
    lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_sync_tenant_idx").on(t.tenantId),
    index("studio_sync_proj_idx").on(t.projectId),
    uniqueIndex("studio_sync_file_region_uniq").on(t.projectId, t.filePath, t.regionId),
  ]
);

export type OproxStudioSyncProvenanceRow = typeof oproxStudioSyncProvenanceTable.$inferSelect;

export const oproxStudioDeploymentsTable = pgTable(
  "oprox_studio_deployments",
  {
    id: text("id").primaryKey(), // dep_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    revisionId: text("revision_id").notNull(),
    environment: text("environment").notNull().default("staging"), // staging | production
    status: text("status").notNull().default("BUILDING"), // BUILDING | SUCCESS | FAILED | ROLLED_BACK
    publicUrl: text("public_url").notNull(),
    buildLogsJson: jsonb("build_logs_json").notNull().default([]),
    deployedBy: text("deployed_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_dep_tenant_idx").on(t.tenantId),
    index("studio_dep_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioDeploymentRow = typeof oproxStudioDeploymentsTable.$inferSelect;

export const oproxStudioPublishedDomainsTable = pgTable(
  "oprox_studio_published_domains",
  {
    id: text("id").primaryKey(), // dom_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    deploymentId: text("deployment_id").notNull().references(() => oproxStudioDeploymentsTable.id, { onDelete: "cascade" }),
    domainName: text("domain_name").notNull(),
    sslActive: boolean("ssl_active").notNull().default(true),
    dnsStatus: text("dns_status").notNull().default("ACTIVE"), // ACTIVE | PENDING
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_dom_tenant_idx").on(t.tenantId),
    index("studio_dom_proj_idx").on(t.projectId),
    uniqueIndex("studio_dom_name_uniq").on(t.domainName),
  ]
);

export type OproxStudioPublishedDomainRow = typeof oproxStudioPublishedDomainsTable.$inferSelect;

export const oproxStudioExportManifestsTable = pgTable(
  "oprox_studio_export_manifests",
  {
    id: text("id").primaryKey(), // exp_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    exportedFilesJson: jsonb("exported_files_json").notNull().default([]),
    checksumHash: text("checksum_hash").notNull(),
    exportedBy: text("exported_by").notNull(),
    exportedAt: timestamp("exported_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_exp_tenant_idx").on(t.tenantId),
    index("studio_exp_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioExportManifestRow = typeof oproxStudioExportManifestsTable.$inferSelect;

// ── OPROX Studio Phase 4 Tables ───────────────────────────────────────────

export const oproxStudioCommentsTable = pgTable(
  "oprox_studio_comments",
  {
    id: text("id").primaryKey(), // cmt_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    pageId: text("page_id"),
    nodeId: text("node_id"),
    revisionId: text("revision_id"),
    authorId: text("author_id").notNull(),
    authorName: text("author_name").notNull(),
    content: text("content").notNull(),
    status: text("status").notNull().default("OPEN"), // OPEN | RESOLVED | REOPENED
    parentCommentId: text("parent_comment_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_cmt_tenant_idx").on(t.tenantId),
    index("studio_cmt_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioCommentRow = typeof oproxStudioCommentsTable.$inferSelect;

export const oproxStudioExperimentsTable = pgTable(
  "oprox_studio_experiments",
  {
    id: text("id").primaryKey(), // expm_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    irSnapshotJson: jsonb("ir_snapshot_json").notNull(),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | DISCARDED | PROMOTED
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_expm_tenant_idx").on(t.tenantId),
    index("studio_expm_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioExperimentRow = typeof oproxStudioExperimentsTable.$inferSelect;

export const oproxStudioSyncConflictsTable = pgTable(
  "oprox_studio_sync_conflicts",
  {
    id: text("id").primaryKey(), // cfl_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    baseHash: text("base_hash").notNull(),
    studioHash: text("studio_hash").notNull(),
    codeHash: text("code_hash").notNull(),
    classification: text("classification").notNull(), // CONFLICT | STUDIO_ONLY_CHANGE | CODE_ONLY_CHANGE | NO_CHANGE
    status: text("status").notNull().default("PENDING"), // PENDING | RESOLVED
    resolutionStrategy: text("resolution_strategy"), // KEEP_STUDIO | KEEP_CODE | MERGE
    resolvedBy: text("resolved_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (t) => [
    index("studio_cfl_tenant_idx").on(t.tenantId),
    index("studio_cfl_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioSyncConflictRow = typeof oproxStudioSyncConflictsTable.$inferSelect;

export const oproxStudioReviewsTable = pgTable(
  "oprox_studio_reviews",
  {
    id: text("id").primaryKey(), // rev_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    revisionId: text("revision_id").notNull(),
    reviewerId: text("reviewer_id").notNull(),
    reviewerName: text("reviewer_name").notNull(),
    status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | CHANGES_REQUESTED
    feedback: text("feedback"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_rev_tenant_idx").on(t.tenantId),
    index("studio_rev_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioReviewRow = typeof oproxStudioReviewsTable.$inferSelect;

export const oproxStudioPromotionTracesTable = pgTable(
  "oprox_studio_promotion_traces",
  {
    id: text("id").primaryKey(), // trc_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    revisionId: text("revision_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    gitBranch: text("git_branch").notNull(),
    commitSha: text("commit_sha").notNull(),
    changeRequestId: text("change_request_id").notNull(),
    ciRunId: text("ci_run_id").notNull(),
    status: text("status").notNull().default("PROMOTED"), // PROMOTED | FAILED
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_trc_tenant_idx").on(t.tenantId),
    index("studio_trc_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioPromotionTraceRow = typeof oproxStudioPromotionTracesTable.$inferSelect;
