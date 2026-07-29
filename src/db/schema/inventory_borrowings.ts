/**
 * Inventory Domain - Inventory Borrowings Schema Definition
 */

import { pgTable, uuid, integer, timestamp, varchar, text } from "drizzle-orm/pg-core";
import { inventoryItems } from "./inventory_items";
import { members } from "./members";
import { users } from "./users";

export const inventoryBorrowings = pgTable("inventory_borrowings", {
  id: uuid("id").primaryKey().defaultRandom(),
  inventoryId: uuid("inventory_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "restrict" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "restrict" }),
  quantity: integer("quantity").default(1).notNull(),
  issueDate: timestamp("issue_date", { withTimezone: true, mode: "date" }),
  dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }),
  returnDate: timestamp("return_date", { withTimezone: true, mode: "date" }),
  status: varchar("status", { length: 20 }).default("requested").notNull(), // requested, approved, issued, returned, overdue, cancelled
  conditionOnReturn: varchar("condition_on_return", { length: 20 }),
  issuedBy: uuid("issued_by").references(() => users.id, { onDelete: "restrict" }),
  returnedBy: uuid("returned_by").references(() => users.id, { onDelete: "restrict" }),
  remarks: text("remarks"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type InventoryBorrowingSelect = typeof inventoryBorrowings.$inferSelect;
export type InventoryBorrowingInsert = typeof inventoryBorrowings.$inferInsert;
