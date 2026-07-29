-- ============================================================================
-- RCMS Migration Script: Redesign Lookup & Master Table Audit Strategy
-- Description: Drop NOT NULL constraint on created_by & updated_by columns in 
--              master/lookup tables to allow database seeding on an empty DB
--              without requiring pre-existing application user records.
-- ============================================================================

-- 1. Branches Table
ALTER TABLE IF EXISTS branches ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS branches ALTER COLUMN updated_by DROP NOT NULL;

-- 2. Academic Years Table
ALTER TABLE IF EXISTS academic_years ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS academic_years ALTER COLUMN updated_by DROP NOT NULL;

-- 3. Semesters Table
ALTER TABLE IF EXISTS semesters ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS semesters ALTER COLUMN updated_by DROP NOT NULL;

-- 4. Sections Table
ALTER TABLE IF EXISTS sections ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS sections ALTER COLUMN updated_by DROP NOT NULL;

-- 5. Roles Table
ALTER TABLE IF EXISTS roles ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS roles ALTER COLUMN updated_by DROP NOT NULL;

-- 6. Permissions Table
ALTER TABLE IF EXISTS permissions ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS permissions ALTER COLUMN updated_by DROP NOT NULL;

-- 7. Role Permissions Table
ALTER TABLE IF EXISTS role_permissions ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS role_permissions ALTER COLUMN updated_by DROP NOT NULL;

-- 8. System Settings Table
ALTER TABLE IF EXISTS system_settings ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS system_settings ALTER COLUMN updated_by DROP NOT NULL;

-- 9. Notification Templates Table
ALTER TABLE IF EXISTS notification_templates ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS notification_templates ALTER COLUMN updated_by DROP NOT NULL;

-- 10. Point Rules Table
ALTER TABLE IF EXISTS point_rules ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS point_rules ALTER COLUMN updated_by DROP NOT NULL;

-- 11. Sponsorship Packages Table
ALTER TABLE IF EXISTS sponsorship_packages ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE IF EXISTS sponsorship_packages ALTER COLUMN updated_by DROP NOT NULL;
