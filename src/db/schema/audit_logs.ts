/**
 * Audit Logs Schema Definition
 */

import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "restrict" }),
  module: varchar("module", { length: 50 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ip: varchar("ip", { length: 45 }),
  browser: varchar("browser", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type AuditLogSelect = typeof auditLogs.$inferSelect;
export type AuditLogInsert = typeof auditLogs.$inferInsert;
