# RCMS Database Seeding Policy

## Conventions
- Seeding routines must be placed under `src/db/seeds/`.
- Seed scripts must check for existing data to prevent duplicate primary keys or constraints violations.
- Never execute seeding logic in the production environment unless designated as global configuration settings.

## Execution Order
1. Seed Roles & Permissions matrix values first.
2. Seed Academic Year & Semester constants.
3. Seed default admin credentials (only in local/development context).
