# RCMS Development Utility — Database Reset (`reset-project.sql`)

## Overview
`scripts/reset-project.sql` is the **single source of truth** for clearing application data from the RCMS database during development and testing cycles.

---

## When to Use
- **Feature Sprint Testing**: Every time a new feature sprint is completed and clean-slate testing is required.
- **Integration Test Preparation**: Before running full end-to-end integration test suites.
- **Stale Data Cleanup**: When dummy records or orphaned test entries clutter local/staging environments.

---

## What It Deletes
- **All Application Data**: Deletes 100% of rows from every application table across all domains:
  - **Academic Structure**: `academic_years`, `semesters`, `branches`, `sections`
  - **Identity & Members**: `members`, `memberships`
  - **Attendance Domain**: `attendance_sessions`, `volunteer_codes`, `attendance_records`
  - **Operations Domain**: `events`, `event_participations`, `tasks`, `task_completions`
  - **Points Domain**: `point_rules`, `points_ledger`
  - **Communication Domain**: `notification_templates`, `notifications`
  - **Inventory Domain**: `inventory_items`, `inventory_borrowings`
  - **Finance Domain**: `sponsors`, `sponsorship_packages`, `sponsorship_agreements`, `budgets`, `expenses`, `financial_transactions`
  - **Security & System**: `roles`, `permissions`, `role_permissions`, `audit_logs`, `system_settings`, `users` (except system admin)
- **Sequences & Identity Values**: Automatically resets sequence generators (`RESTART IDENTITY CASCADE`).

---

## What It Preserves
- **Database Schema**: All table structures, column definitions, data types, default values, and foreign keys remain 100% intact.
- **Constraints & Indexes**: Primary keys, foreign key constraints, unique constraints, and B-tree/GIN indexes are preserved.
- **Triggers & Functions**: All PL/pgSQL database triggers and stored functions are preserved.
- **Row-Level Security (RLS)**: RLS policies and table security parameters are preserved.
- **Migrations**: Drizzle ORM and Supabase migration history tables are preserved.
- **System Admin User**: The default system super_admin account (`00000000-0000-0000-0000-000000000001`) is automatically re-seeded so authentication and system actions continue working immediately.

---

## Maintenance Rule

> [!IMPORTANT]
> **Synchronization Guarantee**: Whenever a new database table is added to RCMS during feature development, `scripts/reset-project.sql` MUST be updated to include the new table name in the `app_tables` array within the **same commit**.

---

## How to Execute

### 1. In Supabase SQL Editor
Open [`scripts/reset-project.sql`](file:///c:/Vindyan/RCMS/scripts/reset-project.sql) in your code editor, copy all text, paste into the Supabase SQL Editor, and click **Run**.

### 2. Via psql CLI
```bash
psql $DATABASE_URL -f scripts/reset-project.sql
```
