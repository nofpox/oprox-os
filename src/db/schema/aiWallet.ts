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
