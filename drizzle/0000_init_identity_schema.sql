-- Migration 0000: Initialize Identity & Security Schema
-- Created: July 2026

CREATE TABLE IF NOT EXISTS "roles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(50) NOT NULL UNIQUE,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "permissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "module" VARCHAR(50) NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT "permissions_module_action_uq" UNIQUE ("module", "action")
);

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE RESTRICT,
  "status" VARCHAR(20) DEFAULT 'active' NOT NULL,
  "last_login" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "deleted_by" UUID,
  "version" INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "system_settings" (
  "key" VARCHAR(100) PRIMARY KEY,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updated_by" UUID
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "module" VARCHAR(50) NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "old_value" JSONB,
  "new_value" JSONB,
  "ip" VARCHAR(45),
  "browser" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
