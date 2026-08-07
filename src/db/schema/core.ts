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
