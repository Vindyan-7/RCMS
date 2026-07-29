/**
 * System Settings Schema Definition
 */

import { pgTable, varchar, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedBy: uuid("updated_by"),
});

export type SystemSettingSelect = typeof systemSettings.$inferSelect;
export type SystemSettingInsert = typeof systemSettings.$inferInsert;
