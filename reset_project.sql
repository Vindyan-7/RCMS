-- ====================================================================
-- RCMS CORE — RESET PROJECT DATA ("ALL CLEAR")
-- ====================================================================
-- Description:
--   Idempotent script to clear all data from every database table in RCMS.
--   Safe to run infinitely. Uses to_regclass() to safely check table existence
--   before truncating so missing tables are silently skipped without syntax errors.
-- 
-- Guiding Guarantee:
--   All table structures, schemas, columns, constraints, foreign keys,
--   enums, indexes, and triggers remain 100% intact. Only data rows are removed.
-- ====================================================================

DO $$
DECLARE
  target_tables text[] := ARRAY[
    'financial_transactions',
    'expenses',
    'budgets',
    'sponsorship_agreements',
    'sponsorship_packages',
    'sponsors',
    'inventory_borrowings',
    'inventory_items',
    'notifications',
    'notification_templates',
    'points_ledger',
    'point_rules',
    'task_completions',
    'tasks',
    'event_participations',
    'events',
    'attendance_records',
    'volunteer_codes',
    'attendance_sessions',
    'memberships',
    'members',
    'sections',
    'branches',
    'semesters',
    'academic_years',
    'audit_logs',
    'system_settings',
    'role_permissions',
    'users',
    'permissions',
    'roles'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY target_tables LOOP
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
