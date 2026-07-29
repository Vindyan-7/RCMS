-- Migration 0009: Initialize Finance & Sponsorship Domain Schema
-- Created: July 2026

CREATE TABLE IF NOT EXISTS "sponsors" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "type" VARCHAR(50) DEFAULT 'organization' NOT NULL,
  "contact_email" VARCHAR(255) NOT NULL,
  "contact_phone" VARCHAR(20),
  "status" VARCHAR(20) DEFAULT 'active' NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "sponsorship_packages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "tier" VARCHAR(20) DEFAULT 'gold' NOT NULL,
  "amount" INTEGER NOT NULL,
  "duration_months" INTEGER DEFAULT 12 NOT NULL,
  "benefits" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "sponsorship_agreements" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sponsor_id" UUID NOT NULL REFERENCES "sponsors"("id") ON DELETE RESTRICT,
  "package_id" UUID REFERENCES "sponsorship_packages"("id") ON DELETE RESTRICT,
  "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" VARCHAR(20) DEFAULT 'active' NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "budgets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "category" VARCHAR(50) NOT NULL,
  "allocated_amount" INTEGER NOT NULL,
  "reserved_amount" INTEGER DEFAULT 0 NOT NULL,
  "utilized_amount" INTEGER DEFAULT 0 NOT NULL,
  "status" VARCHAR(20) DEFAULT 'active' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "expenses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "budget_id" UUID NOT NULL REFERENCES "budgets"("id") ON DELETE RESTRICT,
  "title" VARCHAR(150) NOT NULL,
  "amount" INTEGER NOT NULL,
  "category" VARCHAR(50) NOT NULL,
  "vendor" VARCHAR(100),
  "status" VARCHAR(20) DEFAULT 'submitted' NOT NULL,
  "submitted_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "remarks" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "financial_transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" VARCHAR(50) NOT NULL,
  "amount" INTEGER NOT NULL,
  "reference_type" VARCHAR(50),
  "reference_id" UUID,
  "created_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "remarks" TEXT
);

-- Performance & Aggregation Indexes
CREATE INDEX IF NOT EXISTS "idx_expenses_budget_id" ON "expenses" ("budget_id");
CREATE INDEX IF NOT EXISTS "idx_expenses_status" ON "expenses" ("status");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_type" ON "financial_transactions" ("type");
