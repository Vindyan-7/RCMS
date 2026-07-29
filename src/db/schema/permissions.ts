/**
 * Permissions Schema Definition
 */

import { pgTable, uuid, varchar, unique } from "drizzle-orm/pg-core";
import { timestampsColumns } from "./timestamps";

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    module: varchar("module", { length: 50 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    ...timestampsColumns,
  },
  (table) => ({
    moduleActionUnq: unique("permissions_module_action_uq").on(
      table.module,
      table.action
    ),
  })
);

export type PermissionSelect = typeof permissions.$inferSelect;
export type PermissionInsert = typeof permissions.$inferInsert;
