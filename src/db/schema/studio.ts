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
