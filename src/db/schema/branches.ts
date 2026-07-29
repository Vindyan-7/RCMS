/**
 * Academic Branches Schema Definition
 */

import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const branches = pgTable("branches", {
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  ...baseColumns,
});

export type BranchSelect = typeof branches.$inferSelect;
export type BranchInsert = typeof branches.$inferInsert;
