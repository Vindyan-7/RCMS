-- Migration 0005: Initialize Operations Domain Schema
-- Created: July 2026

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "points" INTEGER DEFAULT 10 NOT NULL,
  "status" VARCHAR(20) DEFAULT 'active' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "task_completions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "task_id" UUID NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "member_id" UUID NOT NULL REFERENCES "members"("id") ON DELETE RESTRICT,
  "completed_by" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "completed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "task_completions_task_member_uq" UNIQUE ("task_id", "member_id")
);

CREATE TABLE IF NOT EXISTS "events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "venue" VARCHAR(100),
  "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "points" INTEGER DEFAULT 20 NOT NULL,
  "status" VARCHAR(20) DEFAULT 'upcoming' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "event_participations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "member_id" UUID NOT NULL REFERENCES "members"("id") ON DELETE RESTRICT,
  "verified_by" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "verified_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "event_participations_event_member_uq" UNIQUE ("event_id", "member_id")
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_task_completions_task_id" ON "task_completions" ("task_id");
CREATE INDEX IF NOT EXISTS "idx_task_completions_member_id" ON "task_completions" ("member_id");
CREATE INDEX IF NOT EXISTS "idx_event_participations_event_id" ON "event_participations" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_event_participations_member_id" ON "event_participations" ("member_id");
