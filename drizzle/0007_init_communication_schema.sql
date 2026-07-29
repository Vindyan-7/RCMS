-- Migration 0007: Initialize Communication Domain Schema
-- Created: July 2026

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipient_id" UUID NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
  "title" VARCHAR(150) NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR(50) DEFAULT 'general' NOT NULL,
  "channel" VARCHAR(20) DEFAULT 'in_app' NOT NULL,
  "priority" VARCHAR(20) DEFAULT 'normal' NOT NULL,
  "read" BOOLEAN DEFAULT FALSE NOT NULL,
  "read_at" TIMESTAMP WITH TIME ZONE,
  "status" VARCHAR(20) DEFAULT 'pending' NOT NULL,
  "scheduled_at" TIMESTAMP WITH TIME ZONE,
  "delivered_at" TIMESTAMP WITH TIME ZONE,
  "created_by" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification_templates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "name" VARCHAR(100) NOT NULL,
  "subject" VARCHAR(150),
  "template_text" TEXT NOT NULL,
  "channel" VARCHAR(20) DEFAULT 'in_app' NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_notifications_recipient_id" ON "notifications" ("recipient_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications" ("read");
CREATE INDEX IF NOT EXISTS "idx_notification_templates_code" ON "notification_templates" ("code");
