# RCMS Migration Policy & Conventions

## Naming Conventions
- All migration files must be generated via `drizzle-kit generate:pg`.
- Custom migrations must be prefixed with a 4-digit sequential version prefix (e.g., `0000_init_schemas.sql`, `0001_add_audit_logs.sql`).
- Description slugs must use lowercase alphanumeric characters separated by underscores.

## Execution Order
1. Local Database Environment validation.
2. Staging Environment migration runs (via Vercel CLI pipeline).
3. Production Migration runs. Manual approval via DB deployment runner dashboard.

## Rollback Policy
- All migrations must have a corresponding down migration where practical.
- Destructive operations (drop table, drop column) must be preceded by a database backup step.
- Rollbacks in production are executed strictly by restoring a daily snapshot when data corruption risks exist.
