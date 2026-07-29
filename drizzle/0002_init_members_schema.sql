-- Migration 0002: Initialize Member Identity Schema
-- Created: July 2026

CREATE TABLE IF NOT EXISTS "members" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" VARCHAR(20) NOT NULL UNIQUE,
  "roll_number" VARCHAR(30) NOT NULL UNIQUE,
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "phone" VARCHAR(15) NOT NULL,
  "gender" VARCHAR(20),
  "photo_url" TEXT,
  "branch_id" UUID REFERENCES "branches"("id") ON DELETE RESTRICT,
  "year" INTEGER,
  "status" VARCHAR(20) DEFAULT 'active' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);
