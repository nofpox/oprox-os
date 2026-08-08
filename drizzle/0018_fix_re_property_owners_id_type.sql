-- Migration 0018: Fix re_property_owners.id column type
--
-- The application generates IDs in "po_xxx_timestamp" format (not UUID).
-- The original schema declared this column as uuid, which caused every
-- property-owner association insert to fail in production.
-- Change the column to text so it accepts the application-generated IDs.

ALTER TABLE "re_property_owners"
  ALTER COLUMN "id" SET DATA TYPE text;
