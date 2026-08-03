-- ====================================================================
-- RCMS CORE — PERMANENT DEVELOPMENT RESET UTILITY
-- File: scripts/reset-project.sql
-- ====================================================================
-- Purpose:
--   Single source of truth for resetting the RCMS development database.
-- 
-- Guiding Rules:
--   1. DO NOT drop any tables, schemas, constraints, indexes, triggers,
--      functions, or RLS policies.
--   2. Delete ALL data from every application table cleanly.
--   3. Preserve the database structure completely.
--   4. Reset all identity/sequence values (RESTART IDENTITY CASCADE).
--   5. Preserve migrations.
--   6. Work repeatedly without errors.
--   7. Leave the database like a brand-new installation.
-- ====================================================================

DO $$
DECLARE
  app_tables text[] := ARRAY[
    -- Financial Domain
    'financial_transactions',
    'expenses',
    'budgets',
    'sponsorship_agreements',
    'sponsorship_packages',
    'sponsors',

    -- Inventory Domain
    'inventory_borrowings',
    'inventory_items',

    -- Communication Domain
    'notifications',
    'notification_templates',

    -- Points Domain
    'points_ledger',
    'point_rules',

    -- Operations Domain
    'task_completions',
    'tasks',
    'event_participations',
    'events',

    -- Attendance Domain
    'attendance_records',
    'volunteer_codes',
    'attendance_sessions',

    -- Identity & Memberships Domain
    'memberships',
    'members',

    -- Academic Structure
    'sections',
    'branches',
    'semesters',
    'academic_years',

    -- Security & System Administration
    'audit_logs',
    'system_settings',
    'role_permissions',
    'users',
    'permissions',
    'roles'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY app_tables LOOP
    -- Safely verify table existence in public schema before truncating
    IF to_regclass('public.' || quote_ident(tbl)) IS NOT NULL THEN
      EXECUTE 'TRUNCATE TABLE public.' || quote_ident(tbl) || ' RESTART IDENTITY CASCADE;';
    END IF;
  END LOOP;
END $$;

-- Re-insert default system super_admin user so authentication and system actions continue working
INSERT INTO public.users (id, name, email, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'RCMS System Admin',
  'admin@rcms.robotics.org',
  'super_admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verification Report: Count remaining rows across all application tables
SELECT 
  table_name,
  (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, false, '')))[1]::text::int AS row_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
