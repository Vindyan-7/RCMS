-- Migration 0001: Initialize Academic Structure Schema
-- Created: July 2026

CREATE TABLE IF NOT EXISTS "academic_years" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(20) NOT NULL UNIQUE,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "status" VARCHAR(20) DEFAULT 'active' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "semesters" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "academic_year_id" UUID NOT NULL REFERENCES "academic_years"("id") ON DELETE RESTRICT,
  "name" VARCHAR(50) NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "status" VARCHAR(20) DEFAULT 'active' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "branches" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(10) NOT NULL UNIQUE,
  "name" VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "sections" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "branch_id" UUID NOT NULL REFERENCES "branches"("id") ON DELETE RESTRICT,
  "name" VARCHAR(10) NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL,
  CONSTRAINT "sections_branch_name_uq" UNIQUE ("branch_id", "name")
);
