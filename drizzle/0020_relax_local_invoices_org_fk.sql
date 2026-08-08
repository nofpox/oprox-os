-- Migration 0020: Relax local_invoices.org_id foreign key
--
-- The real estate module creates invoices where org_id is the arbitrary
-- tenant ID string (e.g. "tenant_re_phase2_xxx") which is NOT a row in
-- the platform organizations table. The strict FK constraint causes every
-- real estate invoice to fail with a FK violation.
--
-- Fix: drop the FK constraint so invoices can reference any org/tenant string.

ALTER TABLE "local_invoices"
  DROP CONSTRAINT IF EXISTS "local_invoices_org_id_organizations_id_fk";
