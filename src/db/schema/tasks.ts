/**
 * Operations Domain - Tasks Schema Definition
 */

import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { events } from "./events";

import { semesters } from "./semesters";

export const tasks = pgTable("tasks", {
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  points: integer("points").default(10).notNull(),
  category: varchar("category", { length: 50 }).default("Hardware"),
  status: varchar("status", { length: 20 }).default("active").notNull(), // draft, active, paused, completed, archived
  isUnlimited: boolean("is_unlimited").default(false),
  maxMembers: integer("max_members"),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
  semesterId: uuid("semester_id").references(() => semesters.id, { onDelete: "restrict" }),
  startDate: timestamp("start_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  ...baseColumns,
});

export type TaskSelect = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
