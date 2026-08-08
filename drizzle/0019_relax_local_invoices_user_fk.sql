-- Migration 0019: Relax local_invoices.user_id foreign key
--
-- The real estate module generates invoices for lease charges where the
-- acting user (property manager / system) is NOT an account in the platform
-- users table. The strict NOT NULL + FK constraint causes every real estate
-- invoice creation to fail with a FK violation.
--
-- Fix: drop the FK constraint and make user_id nullable so invoices can be
-- created by system actors without a corresponding users row.

ALTER TABLE "local_invoices"
  ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "local_invoices"
  DROP CONSTRAINT IF EXISTS "local_invoices_user_id_users_id_fk";
