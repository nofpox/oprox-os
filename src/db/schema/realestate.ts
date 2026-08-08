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

// ── OPROX Real Estate Phase 1 Tables ───────────────────────────────────────

export const realEstatePortfoliosTable = pgTable(
  "re_portfolios",
  {
    id: text("id").primaryKey(), // fol_xxx
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    code: text("code"),
    description: text("description"),
    status: text("status").notNull().default("active"), // "active" | "archived"
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_portfolios_tenant_idx").on(t.tenantId),
    index("re_portfolios_status_idx").on(t.status),
  ]
);

export type RealEstatePortfolioRow = typeof realEstatePortfoliosTable.$inferSelect;

export const realEstatePropertiesTable = pgTable(
  "re_properties",
  {
    id: text("id").primaryKey(), // prop_xxx
    tenantId: text("tenant_id").notNull(),
    portfolioId: text("portfolio_id").references(() => realEstatePortfoliosTable.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    type: text("type").notNull(), // standalone_villa | land_plot | apartment_building | residential_compound | commercial_tower | office | retail | warehouse | furnished_apartment | mixed_use | industrial_logistics
    status: text("status").notNull().default("DRAFT"), // DRAFT | ACTIVE | AVAILABLE | RESERVED | LEASED | SOLD | INACTIVE | ARCHIVED
    description: text("description"),
    // Saudi Address fields
    addressRegion: text("address_region"),
    addressCity: text("address_city"),
    addressDistrict: text("address_district"),
    addressStreet: text("address_street"),
    postalCode: text("postal_code"),
    buildingNumber: text("building_number"),
    additionalNumber: text("additional_number"),
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    // Property Specs
    totalAreaSqm: numeric("total_area_sqm"),
    builtUpAreaSqm: numeric("built_up_area_sqm"),
    yearBuilt: integer("year_built"),
    totalUnitsCount: integer("total_units_count").notNull().default(0),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_props_tenant_idx").on(t.tenantId),
    index("re_props_portfolio_idx").on(t.portfolioId),
    index("re_props_type_idx").on(t.type),
    index("re_props_status_idx").on(t.status),
    index("re_props_city_idx").on(t.addressCity),
  ]
);

export type RealEstatePropertyRow = typeof realEstatePropertiesTable.$inferSelect;

export const realEstateBuildingsTable = pgTable(
  "re_buildings",
  {
    id: text("id").primaryKey(), // bldg_xxx
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    totalFloors: integer("total_floors").notNull().default(1),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_bldgs_tenant_idx").on(t.tenantId),
    index("re_bldgs_prop_idx").on(t.propertyId),
  ]
);

export type RealEstateBuildingRow = typeof realEstateBuildingsTable.$inferSelect;

export const realEstateFloorsTable = pgTable(
  "re_floors",
  {
    id: text("id").primaryKey(), // flr_xxx
    tenantId: text("tenant_id").notNull(),
    buildingId: text("building_id").notNull().references(() => realEstateBuildingsTable.id, { onDelete: "cascade" }),
    floorNumber: integer("floor_number").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_floors_tenant_idx").on(t.tenantId),
    index("re_floors_bldg_idx").on(t.buildingId),
  ]
);

export type RealEstateFloorRow = typeof realEstateFloorsTable.$inferSelect;

export const realEstateUnitsTable = pgTable(
  "re_units",
  {
    id: text("id").primaryKey(), // unit_xxx
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    buildingId: text("building_id").references(() => realEstateBuildingsTable.id, { onDelete: "set null" }),
    floorId: text("floor_id").references(() => realEstateFloorsTable.id, { onDelete: "set null" }),
    unitNumber: text("unit_number").notNull(),
    unitType: text("unit_type").notNull().default("apartment"), // apartment | villa | office | retail | warehouse | land_parcel
    status: text("status").notNull().default("AVAILABLE"), // AVAILABLE | RESERVED | LEASED | SOLD | UNDER_MAINTENANCE | INACTIVE
    areaSqm: numeric("area_sqm"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    rentPriceSar: numeric("rent_price_sar"),
    salePriceSar: numeric("sale_price_sar"),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_units_tenant_idx").on(t.tenantId),
    index("re_units_prop_idx").on(t.propertyId),
    index("re_units_bldg_idx").on(t.buildingId),
    index("re_units_floor_idx").on(t.floorId),
    index("re_units_status_idx").on(t.status),
  ]
);

export type RealEstateUnitRow = typeof realEstateUnitsTable.$inferSelect;

export const realEstateOwnersTable = pgTable(
  "re_owners",
  {
    id: text("id").primaryKey(), // own_xxx
    tenantId: text("tenant_id").notNull(),
    fullName: text("full_name").notNull(),
    ownerType: text("owner_type").notNull().default("INDIVIDUAL"), // INDIVIDUAL | CORPORATE | GOVERNMENT
    nationalIdOrCr: text("national_id_or_cr"),
    email: text("email"),
    phone: text("phone"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_owners_tenant_idx").on(t.tenantId),
    index("re_owners_status_idx").on(t.status),
  ]
);

export type RealEstateOwnerRow = typeof realEstateOwnersTable.$inferSelect;

export const realEstatePropertyOwnersTable = pgTable(
  "re_property_owners",
  {
    // Application generates ids in po_xxx_timestamp format (not UUID) — must be text, not uuid.
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull().references(() => realEstateOwnersTable.id, { onDelete: "cascade" }),
    ownershipPercentage: numeric("ownership_percentage").notNull().default("100"),
    isPrimaryOwner: boolean("is_primary_owner").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_prop_owners_tenant_idx").on(t.tenantId),
    index("re_prop_owners_prop_idx").on(t.propertyId),
    index("re_prop_owners_owner_idx").on(t.ownerId),
  ]
);

export type RealEstatePropertyOwnerRow = typeof realEstatePropertyOwnersTable.$inferSelect;

export const realEstateAmenitiesTable = pgTable(
  "re_amenities",
  {
    id: text("id").primaryKey(), // amen_xxx
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    amenityName: text("amenity_name").notNull(),
    amenityCategory: text("amenity_category").default("general"), // general | security | leisure | parking
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_amenities_tenant_idx").on(t.tenantId),
    index("re_amenities_prop_idx").on(t.propertyId),
  ]
);

export type RealEstateAmenityRow = typeof realEstateAmenitiesTable.$inferSelect;

// ── OPROX Real Estate Phase 2 Tables ───────────────────────────────────────

export const realEstateContactsTable = pgTable(
  "re_contacts",
  {
    id: text("id").primaryKey(), // cont_xxx
    tenantId: text("tenant_id").notNull(),
    type: text("type").notNull().default("INDIVIDUAL"), // INDIVIDUAL | COMPANY
    fullName: text("full_name").notNull(),
    arabicName: text("arabic_name"),
    mobile: text("mobile"),
    email: text("email"),
    nationalIdOrIqama: text("national_id_or_iqama"),
    nationality: text("nationality"),
    preferredLanguage: text("preferred_language").default("ar"),
    companyName: text("company_name"),
    crNumber: text("cr_number"),
    vatNumber: text("vat_number"),
    authorizedRep: text("authorized_rep"),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | INACTIVE
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_contacts_tenant_idx").on(t.tenantId),
    index("re_contacts_type_idx").on(t.type),
    index("re_contacts_nat_id_idx").on(t.nationalIdOrIqama),
    index("re_contacts_cr_idx").on(t.crNumber),
    index("re_contacts_status_idx").on(t.status),
  ]
);

export type RealEstateContactRow = typeof realEstateContactsTable.$inferSelect;

export const realEstateTenantsTable = pgTable(
  "re_tenants",
  {
    id: text("id").primaryKey(), // ret_xxx
    tenantId: text("tenant_id").notNull(),
    contactId: text("contact_id").notNull().references(() => realEstateContactsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | BLACKLISTED | INACTIVE
    creditRating: text("credit_rating"), // EXCELLENT | GOOD | FAIR | POOR
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_tenants_tenant_idx").on(t.tenantId),
    index("re_tenants_contact_idx").on(t.contactId),
    index("re_tenants_status_idx").on(t.status),
  ]
);

export type RealEstateTenantRow = typeof realEstateTenantsTable.$inferSelect;

export const realEstateLeasesTable = pgTable(
  "re_leases",
  {
    id: text("id").primaryKey(), // lse_xxx
    tenantId: text("tenant_id").notNull(),
    leaseNumber: text("lease_number").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    reTenantId: text("re_tenant_id").notNull().references(() => realEstateTenantsTable.id, { onDelete: "cascade" }),
    leaseType: text("lease_type").notNull().default("RESIDENTIAL"), // RESIDENTIAL | COMMERCIAL | INDUSTRIAL | RETAIL
    startDate: text("start_date").notNull(), // YYYY-MM-DD
    endDate: text("end_date").notNull(), // YYYY-MM-DD
    contractValueSar: numeric("contract_value_sar").notNull(),
    currency: text("currency").notNull().default("SAR"),
    paymentFrequency: text("payment_frequency").notNull().default("QUARTERLY"), // MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL | CUSTOM
    securityDepositSar: numeric("security_deposit_sar").default("0"),
    gracePeriodDays: integer("grace_period_days").default(0),
    renewalOption: boolean("renewal_option").default(false),
    noticePeriodDays: integer("notice_period_days").default(30),
    ejarContractNumber: text("ejar_contract_number"),
    ejarStatus: text("ejar_status").default("NOT_CONFIGURED"),
    terms: text("terms"),
    status: text("status").notNull().default("DRAFT"), // DRAFT | PENDING_APPROVAL | APPROVED | ACTIVE | EXPIRING | RENEWAL_PENDING | TERMINATION_PENDING | TERMINATED | EXPIRED | CANCELLED
    createdBy: text("created_by").notNull(),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at"),
    activatedAt: timestamp("activated_at"),
    terminatedAt: timestamp("terminated_at"),
    terminationReason: text("termination_reason"),
    parentLeaseId: text("parent_lease_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_leases_tenant_idx").on(t.tenantId),
    index("re_leases_num_idx").on(t.leaseNumber),
    index("re_leases_prop_idx").on(t.propertyId),
    index("re_leases_ret_idx").on(t.reTenantId),
    index("re_leases_status_idx").on(t.status),
  ]
);

export type RealEstateLeaseRow = typeof realEstateLeasesTable.$inferSelect;

export const realEstateLeaseUnitsTable = pgTable(
  "re_lease_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull().references(() => realEstateUnitsTable.id, { onDelete: "cascade" }),
    allocatedRentSar: numeric("allocated_rent_sar"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lease_units_tenant_idx").on(t.tenantId),
    index("re_lease_units_lease_idx").on(t.leaseId),
    index("re_lease_units_unit_idx").on(t.unitId),
  ]
);

export type RealEstateLeaseUnitRow = typeof realEstateLeaseUnitsTable.$inferSelect;

export const realEstateLeaseSchedulesTable = pgTable(
  "re_lease_schedules",
  {
    id: text("id").primaryKey(), // sch_xxx
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    installmentNumber: integer("installment_number").notNull(),
    dueDate: text("due_date").notNull(), // YYYY-MM-DD
    amountSar: numeric("amount_sar").notNull(),
    paidAmountSar: numeric("paid_amount_sar").notNull().default("0"),
    outstandingAmountSar: numeric("outstanding_amount_sar").notNull(),
    status: text("status").notNull().default("UPCOMING"), // UPCOMING | DUE | PARTIALLY_PAID | PAID | OVERDUE | WAIVED | CANCELLED
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lease_sched_tenant_idx").on(t.tenantId),
    index("re_lease_sched_lease_idx").on(t.leaseId),
    index("re_lease_sched_due_idx").on(t.dueDate),
    index("re_lease_sched_status_idx").on(t.status),
  ]
);

export type RealEstateLeaseScheduleRow = typeof realEstateLeaseSchedulesTable.$inferSelect;

export const realEstateLeaseChargesTable = pgTable(
  "re_lease_charges",
  {
    id: text("id").primaryKey(), // chg_xxx
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    scheduleId: text("schedule_id").references(() => realEstateLeaseSchedulesTable.id, { onDelete: "set null" }),
    chargeType: text("charge_type").notNull(), // RENT | SECURITY_DEPOSIT | SERVICE_CHARGE | ADMIN_FEE | UTILITY | MAINTENANCE | OTHER
    description: text("description").notNull(),
    amountSar: numeric("amount_sar").notNull(),
    paidAmountSar: numeric("paid_amount_sar").notNull().default("0"),
    outstandingAmountSar: numeric("outstanding_amount_sar").notNull(),
    status: text("status").notNull().default("DUE"), // DUE | PARTIALLY_PAID | PAID | WAIVED | CANCELLED
    invoiceId: text("invoice_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lease_charges_tenant_idx").on(t.tenantId),
    index("re_lease_charges_lease_idx").on(t.leaseId),
    index("re_lease_charges_type_idx").on(t.chargeType),
    index("re_lease_charges_status_idx").on(t.status),
  ]
);

export type RealEstateLeaseChargeRow = typeof realEstateLeaseChargesTable.$inferSelect;

export const realEstatePaymentsTable = pgTable(
  "re_payments",
  {
    id: text("id").primaryKey(), // pay_xxx
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").references(() => realEstateLeasesTable.id, { onDelete: "set null" }),
    reTenantId: text("re_tenant_id").references(() => realEstateTenantsTable.id, { onDelete: "set null" }),
    paymentNumber: text("payment_number").notNull(),
    paymentDate: text("payment_date").notNull(), // YYYY-MM-DD
    amountSar: numeric("amount_sar").notNull(),
    unallocatedAmountSar: numeric("unallocated_amount_sar").notNull(),
    currency: text("currency").notNull().default("SAR"),
    paymentMethod: text("payment_method").notNull().default("BANK_TRANSFER"), // BANK_TRANSFER | CARD | CASH | SADAD | OTHER
    providerReference: text("provider_reference"),
    paymentStatus: text("payment_status").notNull().default("CONFIRMED"), // PENDING | CONFIRMED | FAILED | REFUNDED | PARTIALLY_REFUNDED | CANCELLED
    notes: text("notes"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_payments_tenant_idx").on(t.tenantId),
    index("re_payments_lease_idx").on(t.leaseId),
    index("re_payments_ret_idx").on(t.reTenantId),
    index("re_payments_num_idx").on(t.paymentNumber),
    index("re_payments_status_idx").on(t.paymentStatus),
  ]
);

export type RealEstatePaymentRow = typeof realEstatePaymentsTable.$inferSelect;

export const realEstatePaymentAllocationsTable = pgTable(
  "re_payment_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    paymentId: text("payment_id").notNull().references(() => realEstatePaymentsTable.id, { onDelete: "cascade" }),
    chargeId: text("charge_id").references(() => realEstateLeaseChargesTable.id, { onDelete: "set null" }),
    scheduleId: text("schedule_id").references(() => realEstateLeaseSchedulesTable.id, { onDelete: "set null" }),
    allocatedAmountSar: numeric("allocated_amount_sar").notNull(),
    allocatedAt: timestamp("allocated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_pay_alloc_tenant_idx").on(t.tenantId),
    index("re_pay_alloc_payment_idx").on(t.paymentId),
    index("re_pay_alloc_charge_idx").on(t.chargeId),
    index("re_pay_alloc_sched_idx").on(t.scheduleId),
  ]
);

export type RealEstatePaymentAllocationRow = typeof realEstatePaymentAllocationsTable.$inferSelect;

export const realEstateSecurityDepositsTable = pgTable(
  "re_security_deposits",
  {
    id: text("id").primaryKey(), // dep_xxx
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    reTenantId: text("re_tenant_id").notNull().references(() => realEstateTenantsTable.id, { onDelete: "cascade" }),
    amountSar: numeric("amount_sar").notNull(),
    heldAmountSar: numeric("held_amount_sar").notNull(),
    deductionsAmountSar: numeric("deductions_amount_sar").default("0"),
    refundedAmountSar: numeric("refunded_amount_sar").default("0"),
    status: text("status").notNull().default("REQUIRED"), // REQUIRED | INVOICED | RECEIVED | HELD | PARTIALLY_APPLIED | APPLIED | REFUND_PENDING | REFUNDED | FORFEITED
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_sec_dep_tenant_idx").on(t.tenantId),
    index("re_sec_dep_lease_idx").on(t.leaseId),
    index("re_sec_dep_ret_idx").on(t.reTenantId),
    index("re_sec_dep_status_idx").on(t.status),
  ]
);

export type RealEstateSecurityDepositRow = typeof realEstateSecurityDepositsTable.$inferSelect;

export const realEstateLeaseEventsTable = pgTable(
  "re_lease_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(), // CREATED | APPROVED | ACTIVATED | RENEWED | TERMINATED | MOVE_IN | MOVE_OUT | PAYMENT_RECEIVED | DEPOSIT_HELD | CANCELLED
    actorId: text("actor_id").notNull(),
    notes: text("notes"),
    eventDataJson: text("event_data_json"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lease_events_tenant_idx").on(t.tenantId),
    index("re_lease_events_lease_idx").on(t.leaseId),
    index("re_lease_events_type_idx").on(t.eventType),
  ]
);

export type RealEstateLeaseEventRow = typeof realEstateLeaseEventsTable.$inferSelect;

export const realEstateLeaseDocumentsTable = pgTable(
  "re_lease_documents",
  {
    id: text("id").primaryKey(), // doc_xxx
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    documentType: text("document_type").notNull(), // SIGNED_LEASE | TENANT_ID | CR_CERTIFICATE | PAYMENT_PROOF | TERMINATION_NOTICE | RENEWAL_DOC | OTHER
    title: text("title").notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size"),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lease_docs_tenant_idx").on(t.tenantId),
    index("re_lease_docs_lease_idx").on(t.leaseId),
    index("re_lease_docs_type_idx").on(t.documentType),
  ]
);

export type RealEstateLeaseDocumentRow = typeof realEstateLeaseDocumentsTable.$inferSelect;

// ── OPROX REAL ESTATE PHASE 3 TABLES ──────────────────────────────────────

export const realEstateLeadsTable = pgTable(
  "re_leads",
  {
    id: text("id").primaryKey(), // lead_xxx
    tenantId: text("tenant_id").notNull(),
    contactId: text("contact_id").references(() => realEstateContactsTable.id, { onDelete: "set null" }),
    leadNumber: text("lead_number").notNull(), // LEAD-2026-00001
    title: text("title").notNull(),
    source: text("source").notNull().default("WEBSITE"), // WEBSITE | PORTAL | DIRECT | REFERRAL | AGENT | PHONE | SOCIAL
    status: text("status").notNull().default("NEW"), // NEW | QUALIFIED | PROPERTY_MATCHED | VIEWING_SCHEDULED | OFFER_MADE | NEGOTIATING | RESERVED | HANDOVER | WON | LOST
    priority: text("priority").notNull().default("MEDIUM"), // LOW | MEDIUM | HIGH | URGENT
    budgetSar: numeric("budget_sar"),
    preferredPropertyType: text("preferred_property_type"),
    preferredCity: text("preferred_city"),
    preferredDistrict: text("preferred_district"),
    notes: text("notes"),
    assignedAgentId: text("assigned_agent_id"),
    lostReason: text("lost_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_leads_tenant_idx").on(t.tenantId),
    index("re_leads_contact_idx").on(t.contactId),
    index("re_leads_status_idx").on(t.status),
    index("re_leads_source_idx").on(t.source),
  ]
);

export type RealEstateLeadRow = typeof realEstateLeadsTable.$inferSelect;

export const realEstateLeadActivitiesTable = pgTable(
  "re_lead_activities",
  {
    id: text("id").primaryKey(), // act_xxx
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").notNull().references(() => realEstateLeadsTable.id, { onDelete: "cascade" }),
    activityType: text("activity_type").notNull(), // INQUIRY | NOTE | CALL | EMAIL | MEETING | STAGE_CHANGE | VIEWING_RECORDED | OFFER_RECORDED
    summary: text("summary").notNull(),
    details: text("details"),
    actorId: text("actor_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lead_act_tenant_idx").on(t.tenantId),
    index("re_lead_act_lead_idx").on(t.leadId),
    index("re_lead_act_type_idx").on(t.activityType),
  ]
);

export type RealEstateLeadActivityRow = typeof realEstateLeadActivitiesTable.$inferSelect;

export const realEstateLeadPropertyMatchesTable = pgTable(
  "re_lead_property",
  {
    id: text("id").primaryKey(), // lpm_xxx
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").notNull().references(() => realEstateLeadsTable.id, { onDelete: "cascade" }),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    unitId: text("unit_id").references(() => realEstateUnitsTable.id, { onDelete: "cascade" }),
    matchScore: integer("match_score").default(100),
    status: text("status").notNull().default("SHORTLISTED"), // SHORTLISTED | VIEWED | OFFERED | RESERVED | REJECTED
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lead_prop_tenant_idx").on(t.tenantId),
    index("re_lead_prop_lead_idx").on(t.leadId),
    index("re_lead_prop_unit_idx").on(t.unitId),
  ]
);

export type RealEstateLeadPropertyMatchRow = typeof realEstateLeadPropertyMatchesTable.$inferSelect;

export const realEstateViewingsTable = pgTable(
  "re_viewings",
  {
    id: text("id").primaryKey(), // vw_xxx
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").notNull().references(() => realEstateLeadsTable.id, { onDelete: "cascade" }),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    unitId: text("unit_id").references(() => realEstateUnitsTable.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at").notNull(),
    completedAt: timestamp("completed_at"),
    status: text("status").notNull().default("SCHEDULED"), // SCHEDULED | COMPLETED | CANCELLED | NO_SHOW
    feedback: text("feedback"),
    agentRating: integer("agent_rating"),
    clientInterestLevel: text("client_interest_level"), // HIGH | MEDIUM | LOW
    assignedAgentId: text("assigned_agent_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_viewings_tenant_idx").on(t.tenantId),
    index("re_viewings_lead_idx").on(t.leadId),
    index("re_viewings_status_idx").on(t.status),
  ]
);

export type RealEstateViewingRow = typeof realEstateViewingsTable.$inferSelect;

export const realEstateOffersTable = pgTable(
  "re_offers",
  {
    id: text("id").primaryKey(), // ofr_xxx
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").notNull().references(() => realEstateLeadsTable.id, { onDelete: "cascade" }),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    unitId: text("unit_id").references(() => realEstateUnitsTable.id, { onDelete: "cascade" }),
    offerNumber: text("offer_number").notNull(), // OFR-2026-00001
    offeredAmountSar: numeric("offered_amount_sar").notNull(),
    depositAmountSar: numeric("deposit_amount_sar").default("0"),
    paymentFrequency: text("payment_frequency").default("ANNUAL"), // MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL | CUSTOM
    proposedStartDate: text("proposed_start_date"),
    proposedEndDate: text("proposed_end_date"),
    status: text("status").notNull().default("DRAFT"), // DRAFT | SUBMITTED | COUNTERED | ACCEPTED | REJECTED | EXPIRED | WITHDRAWN
    counterAmountSar: numeric("counter_amount_sar"),
    specialTerms: text("special_terms"),
    validUntil: timestamp("valid_until"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_offers_tenant_idx").on(t.tenantId),
    index("re_offers_lead_idx").on(t.leadId),
    index("re_offers_status_idx").on(t.status),
  ]
);

export type RealEstateOfferRow = typeof realEstateOffersTable.$inferSelect;

export const realEstateReservationsTable = pgTable(
  "re_reservations",
  {
    id: text("id").primaryKey(), // res_xxx
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").references(() => realEstateLeadsTable.id, { onDelete: "set null" }),
    offerId: text("offer_id").references(() => realEstateOffersTable.id, { onDelete: "set null" }),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull().references(() => realEstateUnitsTable.id, { onDelete: "cascade" }),
    reTenantId: text("re_tenant_id").references(() => realEstateTenantsTable.id, { onDelete: "set null" }),
    reservationNumber: text("reservation_number").notNull(), // RES-2026-00001
    reservationFeeSar: numeric("reservation_fee_sar").notNull(),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | CONVERTED_TO_LEASE | EXPIRED | CANCELLED | FORFEITED
    reservedUntil: timestamp("reserved_until").notNull(),
    convertedLeaseId: text("converted_lease_id").references(() => realEstateLeasesTable.id, { onDelete: "set null" }),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_reservations_tenant_idx").on(t.tenantId),
    index("re_reservations_unit_idx").on(t.unitId),
    index("re_reservations_status_idx").on(t.status),
  ]
);

export type RealEstateReservationRow = typeof realEstateReservationsTable.$inferSelect;

// ── OPROX REAL ESTATE PHASE 4 TABLES (PROPTECH MARKETPLACE) ───────────────

export const realEstateDevelopersTable = pgTable(
  "re_developers",
  {
    id: text("id").primaryKey(), // dev_xxx
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    coverImageUrl: text("cover_image_url"),
    description: text("description"),
    website: text("website"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    establishedYear: integer("established_year"),
    headquartersCity: text("headquarters_city"),
    verified: boolean("verified").notNull().default(false),
    rating: real("rating").default(4.8),
    totalProjects: integer("total_projects").default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_devs_tenant_idx").on(t.tenantId),
    index("re_devs_slug_idx").on(t.slug),
    index("re_devs_verified_idx").on(t.verified),
  ]
);

export type RealEstateDeveloperRow = typeof realEstateDevelopersTable.$inferSelect;

export const realEstateProjectsTable = pgTable(
  "re_projects",
  {
    id: text("id").primaryKey(), // prj_xxx
    tenantId: text("tenant_id").notNull(),
    developerId: text("developer_id").references(() => realEstateDevelopersTable.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    city: text("city").notNull(),
    district: text("district").notNull(),
    latitude: real("latitude"),
    longitude: real("longitude"),
    masterPlanUrl: text("master_plan_url"),
    coverImageUrl: text("cover_image_url"),
    galleryUrls: jsonb("gallery_urls").default([]),
    completionStatus: text("completion_status").notNull().default("UNDER_CONSTRUCTION"), // OFF_PLAN | UNDER_CONSTRUCTION | COMPLETED | READY
    completionYear: integer("completion_year"),
    startingPriceSar: numeric("starting_price_sar"),
    totalUnits: integer("total_units").default(0),
    availableUnits: integer("available_units").default(0),
    amenities: jsonb("amenities").default([]),
    constructionProgressPct: integer("construction_progress_pct").default(0),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_projects_tenant_idx").on(t.tenantId),
    index("re_projects_dev_idx").on(t.developerId),
    index("re_projects_slug_idx").on(t.slug),
    index("re_projects_city_idx").on(t.city),
    index("re_projects_status_idx").on(t.completionStatus),
    index("re_projects_featured_idx").on(t.featured),
  ]
);

export type RealEstateProjectRow = typeof realEstateProjectsTable.$inferSelect;

export const realEstatePublicListingsTable = pgTable(
  "re_public_listings",
  {
    id: text("id").primaryKey(), // lst_xxx
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => realEstateProjectsTable.id, { onDelete: "set null" }),
    developerId: text("developer_id").references(() => realEstateDevelopersTable.id, { onDelete: "set null" }),
    listingNumber: text("listing_number").notNull(), // LST-2026-00001
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    listingType: text("listing_type").notNull(), // SALE | RENT | SHORT_TERM
    category: text("category").notNull().default("RESIDENTIAL"), // RESIDENTIAL | COMMERCIAL | LAND | INDUSTRIAL | LUXURY
    propertyType: text("property_type").notNull(), // APARTMENT | VILLA | DUPLEX | PENTHOUSE | OFFICE | RETAIL | LAND | WAREHOUSE
    priceSar: numeric("price_sar").notNull(),
    rentFrequency: text("rent_frequency"), // ANNUAL | MONTHLY | WEEKLY | DAILY
    city: text("city").notNull(),
    district: text("district").notNull(),
    address: text("address"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    bedrooms: integer("bedrooms").default(0),
    bathrooms: integer("bathrooms").default(0),
    areaSqm: numeric("area_sqm"),
    furnished: text("furnished").default("UNFURNISHED"), // UNFURNISHED | SEMI_FURNISHED | FULLY_FURNISHED
    amenities: jsonb("amenities").default([]),
    coverImageUrl: text("cover_image_url"),
    galleryUrls: jsonb("gallery_urls").default([]),
    videoUrl: text("video_url"),
    floorPlanUrl: text("floor_plan_url"),
    virtualTour360Url: text("virtual_tour_360_url"),
    completionStatus: text("completion_status").default("READY"), // READY | OFF_PLAN | UNDER_CONSTRUCTION
    status: text("status").notNull().default("PUBLISHED"), // DRAFT | PENDING_MODERATION | PUBLISHED | RESERVED | SOLD | RENTED | ARCHIVED
    featured: boolean("featured").notNull().default(false),
    viewCount: integer("view_count").default(0),
    inquiryCount: integer("inquiry_count").default(0),
    aiGeneratedDescription: text("ai_generated_description"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_listings_tenant_idx").on(t.tenantId),
    index("re_listings_slug_idx").on(t.slug),
    index("re_listings_type_idx").on(t.listingType),
    index("re_listings_category_idx").on(t.category),
    index("re_listings_proptype_idx").on(t.propertyType),
    index("re_listings_city_idx").on(t.city),
    index("re_listings_status_idx").on(t.status),
    index("re_listings_featured_idx").on(t.featured),
    index("re_listings_proj_idx").on(t.projectId),
  ]
);

export type RealEstatePublicListingRow = typeof realEstatePublicListingsTable.$inferSelect;

export const realEstateSavedSearchesTable = pgTable(
  "re_saved_searches",
  {
    id: text("id").primaryKey(), // srch_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    filtersJson: jsonb("filters_json").notNull(),
    notifyEmail: boolean("notify_email").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_saved_srch_tenant_idx").on(t.tenantId),
    index("re_saved_srch_user_idx").on(t.userId),
  ]
);

export type RealEstateSavedSearchRow = typeof realEstateSavedSearchesTable.$inferSelect;

export const realEstateFavoritesTable = pgTable(
  "re_favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    listingId: text("listing_id").notNull().references(() => realEstatePublicListingsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("re_favorites_user_listing_uniq").on(t.userId, t.listingId),
    index("re_favorites_tenant_idx").on(t.tenantId),
    index("re_favorites_user_idx").on(t.userId),
  ]
);

export type RealEstateFavoriteRow = typeof realEstateFavoritesTable.$inferSelect;

export const realEstateInquiriesTable = pgTable(
  "re_inquiries",
  {
    id: text("id").primaryKey(), // inq_xxx
    tenantId: text("tenant_id").notNull(),
    listingId: text("listing_id").references(() => realEstatePublicListingsTable.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => realEstateProjectsTable.id, { onDelete: "set null" }),
    developerId: text("developer_id").references(() => realEstateDevelopersTable.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    message: text("message"),
    inquiryType: text("inquiry_type").default("BUY"), // BUY | RENT | VISIT | GENERAL
    preferredContactMethod: text("preferred_contact_method").default("PHONE"), // PHONE | EMAIL | WHATSAPP
    status: text("status").notNull().default("NEW"), // NEW | CONTACTED | QUALIFIED | CLOSED
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_inquiries_tenant_idx").on(t.tenantId),
    index("re_inquiries_listing_idx").on(t.listingId),
    index("re_inquiries_project_idx").on(t.projectId),
    index("re_inquiries_status_idx").on(t.status),
  ]
);

export type RealEstateInquiryRow = typeof realEstateInquiriesTable.$inferSelect;

export const realEstateAiValuationsTable = pgTable(
  "re_ai_valuations",
  {
    id: text("id").primaryKey(), // val_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    propertyType: text("property_type").notNull(),
    areaSqm: numeric("area_sqm").notNull(),
    bedrooms: integer("bedrooms"),
    estimatedPriceMinSar: numeric("estimated_price_min_sar").notNull(),
    estimatedPriceMaxSar: numeric("estimated_price_max_sar").notNull(),
    estimatedPriceAvgSar: numeric("estimated_price_avg_sar").notNull(),
    estimatedPricePerSqmSar: numeric("estimated_price_per_sqm_sar").notNull(),
    confidenceScorePct: integer("confidence_score_pct").notNull(),
    comparableCount: integer("comparable_count").notNull(),
    marketTrend: text("market_trend"), // UPWARD | STABLE | DOWNWARD
    aiAnalysisSummary: text("ai_analysis_summary"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_ai_val_tenant_idx").on(t.tenantId),
    index("re_ai_val_user_idx").on(t.userId),
  ]
);

export type RealEstateAiValuationRow = typeof realEstateAiValuationsTable.$inferSelect;

// ── OPROX REAL ESTATE PHASE 5 TABLES ──────────────────────────────────────

export const realEstateDesignProjectsTable = pgTable(
  "re_design_projects",
  {
    id: text("id").primaryKey(), // dp_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    projectType: text("project_type").notNull(), // ARCHITECTURAL | INTERIOR | EXTERIOR | RENOVATION | MULTI_DISCIPLINARY
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "set null" }),
    unitId: text("unit_id").references(() => realEstateUnitsTable.id, { onDelete: "set null" }),
    listingId: text("listing_id").references(() => realEstatePublicListingsTable.id, { onDelete: "set null" }),
    developerProjectId: text("developer_project_id").references(() => realEstateProjectsTable.id, { onDelete: "set null" }),
    studioProjectId: text("studio_project_id"), // Link to OPROX Studio project if exported
    status: text("status").notNull().default("ACTIVE"), // DRAFT | ACTIVE | APPROVED | REJECTED | ARCHIVED
    requirementsJson: jsonb("requirements_json"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_dp_tenant_idx").on(t.tenantId),
    index("re_dp_user_idx").on(t.userId),
    index("re_dp_property_idx").on(t.propertyId),
    index("re_dp_type_idx").on(t.projectType),
  ]
);

export type RealEstateDesignProjectRow = typeof realEstateDesignProjectsTable.$inferSelect;

export const realEstateDesignConceptsTable = pgTable(
  "re_design_concepts",
  {
    id: text("id").primaryKey(), // dc_xxx
    tenantId: text("tenant_id").notNull(),
    designProjectId: text("design_project_id").notNull().references(() => realEstateDesignProjectsTable.id, { onDelete: "cascade" }),
    conceptName: text("concept_name").notNull(),
    conceptType: text("concept_type").notNull(), // ARCHITECTURAL | INTERIOR | EXTERIOR | LANDSCAPE | RENOVATION
    versionNumber: integer("version_number").notNull().default(1),
    style: text("style"), // Modern | Contemporary | Minimal | Luxury | Classic | Saudi-inspired | Islamic-inspired | Industrial
    spacePlanningJson: jsonb("space_planning_json"),
    interiorDetailsJson: jsonb("interior_details_json"),
    exteriorDetailsJson: jsonb("exterior_details_json"),
    renovationDetailsJson: jsonb("renovation_details_json"),
    rationale: text("rationale"),
    approvalStatus: text("approval_status").notNull().default("CONCEPTUAL"), // CONCEPTUAL | REVIEWED | APPROVED | REJECTED
    isConceptualNotice: boolean("is_conceptual_notice").notNull().default(true),
    aiGenerated: boolean("ai_generated").notNull().default(true),
    aiModelUsed: text("ai_model_used"),
    mediaJson: jsonb("media_json"),
    model3dStatus: text("model3d_status").default("NOT_CONFIGURED"), // NOT_CONFIGURED | PENDING | READY
    spatialMetaJson: jsonb("spatial_meta_json"), // Phase 6 readiness
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_dc_tenant_idx").on(t.tenantId),
    index("re_dc_project_idx").on(t.designProjectId),
    index("re_dc_type_idx").on(t.conceptType),
  ]
);

export type RealEstateDesignConceptRow = typeof realEstateDesignConceptsTable.$inferSelect;

export const realEstateInvestmentAnalysesTable = pgTable(
  "re_investment_analyses",
  {
    id: text("id").primaryKey(), // inv_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "set null" }),
    listingId: text("listing_id").references(() => realEstatePublicListingsTable.id, { onDelete: "set null" }),
    purchasePriceSar: numeric("purchase_price_sar").notNull(),
    areaSqm: numeric("area_sqm").notNull(),
    estimatedAnnualRentSar: numeric("estimated_annual_rent_sar").notNull(),
    operatingExpensesAnnualSar: numeric("operating_expenses_annual_sar").default("0"),
    occupancyRatePct: numeric("occupancy_rate_pct").default("95"),
    financingPercentagePct: numeric("financing_percentage_pct").default("0"),
    mortgageInterestRatePct: numeric("mortgage_interest_rate_pct").default("0"),
    loanTenureYears: integer("loan_tenure_years").default(20),
    calculatedMetricsJson: jsonb("calculated_metrics_json").notNull(),
    comparablePropertiesJson: jsonb("comparable_properties_json"),
    dataQualityStatus: text("data_quality_status").notNull().default("ACTUAL_AND_ESTIMATED"), // ACTUAL | ESTIMATED | NOT_MEASURED | DATA_UNAVAILABLE
    aiAnalysisSummary: text("ai_analysis_summary"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_inv_tenant_idx").on(t.tenantId),
    index("re_inv_user_idx").on(t.userId),
    index("re_inv_property_idx").on(t.propertyId),
  ]
);

export type RealEstateInvestmentAnalysisRow = typeof realEstateInvestmentAnalysesTable.$inferSelect;

export const realEstateImmersiveAssetsTable = pgTable(
  "re_immersive_assets",
  {
    id: text("id").primaryKey(), // asset_xxx
    tenantId: text("tenant_id").notNull(),
    linkedEntityType: text("linked_entity_type").notNull(), // PROPERTY | UNIT | DEVELOPER_PROJECT | DESIGN_PROJECT | LISTING
    linkedEntityId: text("linked_entity_id").notNull(),
    assetType: text("asset_type").notNull(), // GLB | GLTF | PANORAMA_360 | VR | AR | DIGITAL_TWIN
    title: text("title").notNull(),
    storageReference: text("storage_reference").notNull(),
    mimeType: text("mime_type"),
    fileSizeBytes: integer("file_size_bytes"),
    version: integer("version").notNull().default(1),
    processingState: text("processing_state").notNull().default("READY"), // PENDING | READY | FAILED | NOT_CONFIGURED
    isPublicAvailable: boolean("is_public_available").notNull().default(true),
    metadataJson: jsonb("metadata_json"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_ia_tenant_idx").on(t.tenantId),
    index("re_ia_linked_idx").on(t.linkedEntityType, t.linkedEntityId),
    index("re_ia_asset_type_idx").on(t.assetType),
  ]
);

export type RealEstateImmersiveAssetRow = typeof realEstateImmersiveAssetsTable.$inferSelect;

export const realEstateDigitalTwinsTable = pgTable(
  "re_digital_twins",
  {
    id: text("id").primaryKey(), // dt_xxx
    tenantId: text("tenant_id").notNull(),
    title: text("title").notNull(),
    linkedEntityType: text("linked_entity_type").notNull(), // PROPERTY | UNIT | DEVELOPER_PROJECT | DESIGN_PROJECT
    linkedEntityId: text("linked_entity_id").notNull(),
    versionNumber: integer("version_number").notNull().default(1),
    isCurrentVersion: boolean("is_current_version").notNull().default(true),
    primaryModelAssetId: text("primary_model_asset_id").references(() => realEstateImmersiveAssetsTable.id, { onDelete: "set null" }),
    floorsCount: integer("floors_count").notNull().default(1),
    spatialMetadataJson: jsonb("spatial_metadata_json").notNull(), // floors, rooms, zones, dimensions, orientation, area, hotspots, material metadata, design references
    designProjectId: text("design_project_id").references(() => realEstateDesignProjectsTable.id, { onDelete: "set null" }),
    designConceptId: text("design_concept_id").references(() => realEstateDesignConceptsTable.id, { onDelete: "set null" }),
    status: text("status").notNull().default("ACTIVE"), // DRAFT | ACTIVE | ARCHIVED
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_dt_tenant_idx").on(t.tenantId),
    index("re_dt_linked_idx").on(t.linkedEntityType, t.linkedEntityId),
    index("re_dt_primary_asset_idx").on(t.primaryModelAssetId),
  ]
);

export type RealEstateDigitalTwinRow = typeof realEstateDigitalTwinsTable.$inferSelect;

export const realEstateVRARLogsTable = pgTable(
  "re_vrar_logs",
  {
    id: text("id").primaryKey(), // vrar_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    sessionType: text("session_type").notNull(), // 3D_ORBIT | WALKTHROUGH | VR | AR | DIGITAL_TWIN
    capabilityState: text("capability_state").notNull(), // SUPPORTED | UNSUPPORTED | NOT_CONFIGURED
    deviceUserAgent: text("device_user_agent"),
    entityId: text("entity_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_vrar_tenant_idx").on(t.tenantId),
    index("re_vrar_user_idx").on(t.userId),
    index("re_vrar_session_idx").on(t.sessionType),
  ]
);

export type RealEstateVRARLogRow = typeof realEstateVRARLogsTable.$inferSelect;
