-- Migration 0006: Initialize Points Domain Schema
-- Created: July 2026

CREATE TABLE IF NOT EXISTS "points_ledger" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL REFERENCES "members"("id") ON DELETE RESTRICT,
  "category" VARCHAR(50) NOT NULL,
  "reference_type" VARCHAR(50),
  "reference_id" UUID,
  "points" INTEGER NOT NULL,
  "created_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "remarks" TEXT
);

CREATE TABLE IF NOT EXISTS "point_rules" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "trigger" VARCHAR(50) NOT NULL,
  "category" VARCHAR(50) NOT NULL,
  "points" INTEGER NOT NULL,
  "enabled" BOOLEAN DEFAULT TRUE NOT NULL,
  "priority" INTEGER DEFAULT 1 NOT NULL,
  "start_date" TIMESTAMP WITH TIME ZONE,
  "end_date" TIMESTAMP WITH TIME ZONE,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

-- Performance & Aggregation Indexes
CREATE INDEX IF NOT EXISTS "idx_points_ledger_member_id" ON "points_ledger" ("member_id");
CREATE INDEX IF NOT EXISTS "idx_points_ledger_category" ON "points_ledger" ("category");
CREATE INDEX IF NOT EXISTS "idx_point_rules_trigger" ON "point_rules" ("trigger");
