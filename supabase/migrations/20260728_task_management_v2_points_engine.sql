-- ============================================================================
-- RCMS Migration Script: Task Management v2 & Points Engine Integration
-- Description: Adds Task lifecycle, category, completion limits, dates,
--              soft-revocation columns, and indexes for tasks, completions, and points.
-- ============================================================================

-- 1. Extend "tasks" table with category, completion limits, dates, and event association
ALTER TABLE IF EXISTS "tasks"
  ADD COLUMN IF NOT EXISTS "category" VARCHAR(50) DEFAULT 'Hardware',
  ADD COLUMN IF NOT EXISTS "is_unlimited" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "max_members" INTEGER,
  ADD COLUMN IF NOT EXISTS "event_id" UUID REFERENCES "events"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMP WITH TIME ZONE;

-- 2. Extend "task_completions" table with soft-revocation, status, and points awarded audit
ALTER TABLE IF EXISTS "task_completions"
  ADD COLUMN IF NOT EXISTS "points_earned" INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS "is_revoked" BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "revoked_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "revoked_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "revocation_reason" TEXT;

-- Remove rigid unique constraint if existing to support soft revocation / multiple completions
ALTER TABLE IF EXISTS "task_completions" DROP CONSTRAINT IF EXISTS "task_completions_task_member_uq";

-- 3. Extend "points_ledger" table with soft-revocation support
ALTER TABLE IF EXISTS "points_ledger"
  ADD COLUMN IF NOT EXISTS "is_revoked" BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "revoked_at" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "revoked_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "revocation_reason" TEXT;

-- 4. Create performance indexes for task completions and soft revocation queries
CREATE INDEX IF NOT EXISTS "idx_task_completions_is_revoked" ON "task_completions" ("is_revoked");
CREATE INDEX IF NOT EXISTS "idx_task_completions_task_member" ON "task_completions" ("task_id", "member_id");
CREATE INDEX IF NOT EXISTS "idx_points_ledger_is_revoked" ON "points_ledger" ("is_revoked");
