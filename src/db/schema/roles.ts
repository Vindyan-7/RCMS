/**
 * Roles Schema Definition
 */

import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const roles = pgTable("roles", {
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  ...baseColumns,
});

export type RoleSelect = typeof roles.$inferSelect;
export type RoleInsert = typeof roles.$inferInsert;
