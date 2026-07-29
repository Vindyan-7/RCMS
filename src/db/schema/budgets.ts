/**
 * Finance Domain - Budgets Schema Definition
 */

import { pgTable, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const budgets = pgTable("budgets", {
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // annual, semester, activity, event, equipment, travel, marketing
  allocatedAmount: integer("allocated_amount").notNull(),
  reservedAmount: integer("reserved_amount").default(0).notNull(),
  utilizedAmount: integer("utilized_amount").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // draft, active, closed
  ...baseColumns,
});

export type BudgetSelect = typeof budgets.$inferSelect;
export type BudgetInsert = typeof budgets.$inferInsert;
