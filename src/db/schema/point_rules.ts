/**
 * Points Domain - Point Rules Schema Definition
 */

import { pgTable, uuid, varchar, integer, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const pointRules = pgTable("point_rules", {
  trigger: varchar("trigger", { length: 50 }).notNull(), // attendance_marked, task_completed, event_attended, manual
  category: varchar("category", { length: 50 }).notNull(),
  points: integer("points").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  priority: integer("priority").default(1).notNull(),
  startDate: timestamp("start_date", { withTimezone: true, mode: "date" }),
  endDate: timestamp("end_date", { withTimezone: true, mode: "date" }),
  description: text("description"),
  ...baseColumns,
});

export type PointRuleSelect = typeof pointRules.$inferSelect;
export type PointRuleInsert = typeof pointRules.$inferInsert;
