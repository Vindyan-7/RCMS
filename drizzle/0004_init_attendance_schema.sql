-- Migration 0004: Initialize Attendance Domain Schema
-- Created: July 2026

CREATE TABLE IF NOT EXISTS "attendance_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(100) NOT NULL,
  "date" DATE NOT NULL,
  "start_time" TIME NOT NULL,
  "end_time" TIME NOT NULL,
  "attendance_points" INTEGER DEFAULT 10 NOT NULL,
  "late_threshold" INTEGER DEFAULT 15 NOT NULL,
  "late_points" INTEGER DEFAULT 5 NOT NULL,
  "status" VARCHAR(20) DEFAULT 'draft' NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "volunteer_codes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL REFERENCES "attendance_sessions"("id") ON DELETE CASCADE,
  "code" VARCHAR(20) NOT NULL UNIQUE,
  "status" VARCHAR(20) DEFAULT 'unused' NOT NULL,
  "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "activated_by" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "activated_at" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS "attendance_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL REFERENCES "members"("id") ON DELETE RESTRICT,
  "session_id" UUID NOT NULL REFERENCES "attendance_sessions"("id") ON DELETE RESTRICT,
  "scan_time" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "points" INTEGER NOT NULL,
  "late" BOOLEAN DEFAULT FALSE NOT NULL,
  "volunteer_user" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "method" VARCHAR(20) DEFAULT 'qr' NOT NULL,
  "remarks" TEXT,
  CONSTRAINT "attendance_records_member_session_uq" UNIQUE ("member_id", "session_id")
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS "idx_attendance_records_session_id" ON "attendance_records" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_records_member_id" ON "attendance_records" ("member_id");
