-- Migration 0003: Initialize Membership Schema
-- Created: July 2026

CREATE TABLE IF NOT EXISTS "memberships" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
  "academic_year_id" UUID NOT NULL REFERENCES "academic_years"("id") ON DELETE RESTRICT,
  "semester_id" UUID NOT NULL REFERENCES "semesters"("id") ON DELETE RESTRICT,
  "role_id" UUID REFERENCES "roles"("id") ON DELETE RESTRICT,
  "status" VARCHAR(20) DEFAULT 'active' NOT NULL,
  "join_date" DATE DEFAULT NOW() NOT NULL,
  "exit_date" DATE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL,
  CONSTRAINT "memberships_member_year_sem_uq" UNIQUE ("member_id", "academic_year_id", "semester_id")
);
