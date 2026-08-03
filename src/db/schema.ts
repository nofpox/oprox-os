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


