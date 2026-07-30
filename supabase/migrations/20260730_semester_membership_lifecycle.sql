-- ============================================================
-- Migration: Semester & Membership Lifecycle
-- Date: 2026-07-30
-- Description:
--   1. Add registration_start / registration_end columns to semesters
--   2. Normalise semester status to: upcoming | active | completed
--   3. Add 'past' status option to memberships (for semester-close workflow)
-- Safe for existing data: all new columns are nullable, existing rows unaffected
-- ============================================================

-- 1. Extend semesters table
ALTER TABLE semesters
  ADD COLUMN IF NOT EXISTS registration_start DATE,
  ADD COLUMN IF NOT EXISTS registration_end   DATE;

-- 2. Update any legacy semesters that have status='active' to remain 'active'
--    (no change needed — 'active' is already a valid value)

-- 3. Allow 'past' as a valid membership status (Postgres VARCHAR — no enum to alter)
--    No DDL needed: VARCHAR(20) already accepts any string value.
--    If you have a CHECK constraint, run:
-- ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_status_check;
-- ALTER TABLE memberships ADD CONSTRAINT memberships_status_check
--   CHECK (status IN ('active', 'inactive', 'suspended', 'past'));

-- Verification
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'semesters'
  AND column_name IN ('registration_start', 'registration_end', 'status')
ORDER BY ordinal_position;
