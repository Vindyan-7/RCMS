/**
 * Finance Domain - Immutable Financial Transactions Ledger Schema Definition
 */

import { pgTable, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const financialTransactions = pgTable("financial_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).notNull(), // income, expense, donation, reimbursement, adjustment
  amount: integer("amount").notNull(),
  referenceType: varchar("reference_type", { length: 50 }), // sponsorship_agreements, expenses, manual
  referenceId: uuid("reference_id"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  remarks: text("remarks"),
});

export type FinancialTransactionSelect = typeof financialTransactions.$inferSelect;
export type FinancialTransactionInsert = typeof financialTransactions.$inferInsert;
