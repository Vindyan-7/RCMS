-- ============================================================
-- Migration: Semester Context Integration v1
-- Date: 2026-08-02
-- Description:
--   1. Add semester_id FK to attendance_sessions
--   2. Add semester_id FK to points_ledger
--   3. Add semester_id FK to tasks
-- All columns are NULLABLE to preserve historical integrity.
-- ============================================================

ALTER TABLE attendance_sessions
  ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT;

ALTER TABLE points_ledger
  ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT;
