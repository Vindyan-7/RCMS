-- Migration 0008: Initialize Inventory Domain Schema
-- Created: July 2026

CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "category" VARCHAR(50) NOT NULL,
  "quantity" INTEGER DEFAULT 1 NOT NULL,
  "available" INTEGER DEFAULT 1 NOT NULL,
  "condition" VARCHAR(20) DEFAULT 'good' NOT NULL,
  "location" VARCHAR(100),
  "remarks" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory_borrowings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "inventory_id" UUID NOT NULL REFERENCES "inventory_items"("id") ON DELETE RESTRICT,
  "member_id" UUID NOT NULL REFERENCES "members"("id") ON DELETE RESTRICT,
  "quantity" INTEGER DEFAULT 1 NOT NULL,
  "issue_date" TIMESTAMP WITH TIME ZONE,
  "due_date" TIMESTAMP WITH TIME ZONE,
  "return_date" TIMESTAMP WITH TIME ZONE,
  "status" VARCHAR(20) DEFAULT 'requested' NOT NULL,
  "condition_on_return" VARCHAR(20),
  "issued_by" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "returned_by" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "remarks" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_inventory_borrowings_inventory_id" ON "inventory_borrowings" ("inventory_id");
CREATE INDEX IF NOT EXISTS "idx_inventory_borrowings_member_id" ON "inventory_borrowings" ("member_id");
CREATE INDEX IF NOT EXISTS "idx_inventory_borrowings_status" ON "inventory_borrowings" ("status");
