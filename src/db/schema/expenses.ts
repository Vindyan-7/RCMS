/**
 * Finance Domain - Expenses Schema Definition
 */

import { pgTable, uuid, varchar, text, integer } from "drizzle-orm/pg-core";
import { budgets } from "./budgets";
import { users } from "./users";
import { baseColumns } from "./base";

export const expenses = pgTable("expenses", {
  budgetId: uuid("budget_id")
    .notNull()
    .references(() => budgets.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 150 }).notNull(),
  amount: integer("amount").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  vendor: varchar("vendor", { length: 100 }),
  status: varchar("status", { length: 20 }).default("submitted").notNull(), // draft, submitted, approved, rejected, paid, archived
  submittedBy: uuid("submitted_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  remarks: text("remarks"),
  ...baseColumns,
});

export type ExpenseSelect = typeof expenses.$inferSelect;
export type ExpenseInsert = typeof expenses.$inferInsert;
