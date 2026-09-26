-- ============================================================================
-- RCMS Migration Script: Club Events Points Ledger Integration
-- Description:
-- 1. Adds submission_points and voting_percentage configuration columns to events
-- 2. Sets default 100 submission points and 40% voting points (40 pts) for 3D Modeling challenge
-- 3. Adds helpful index to points_ledger for member and reference lookup
-- ============================================================================

-- 1. Add point configuration columns to events
ALTER TABLE IF EXISTS "events"
  ADD COLUMN IF NOT EXISTS "submission_points" INTEGER DEFAULT 100 NOT NULL,
  ADD COLUMN IF NOT EXISTS "voting_percentage" INTEGER DEFAULT 40 NOT NULL;

-- 2. Configure 3D Modeling & 3D Printing Challenge event specifically
UPDATE "events"
SET
  "submission_points" = 100,
  "voting_percentage" = 40,
  "points" = 100
WHERE "name" = '3D Modeling & 3D Printing Challenge';

-- 3. Add index on points_ledger for fast idempotency lookup by member and reference
CREATE INDEX IF NOT EXISTS "idx_points_ledger_member_ref"
  ON "points_ledger" ("member_id", "reference_type", "reference_id");

CREATE INDEX IF NOT EXISTS "idx_points_ledger_member_cat"
  ON "points_ledger" ("member_id", "category");
