/**
 * Operations Domain - Events Schema Definition
 */

import { pgTable, uuid, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const events = pgTable("events", {
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  venue: varchar("venue", { length: 100 }),
  startDate: timestamp("start_date", { withTimezone: true, mode: "date" }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true, mode: "date" }).notNull(),
  points: integer("points").default(20).notNull(),
  status: varchar("status", { length: 20 }).default("upcoming").notNull(), // upcoming, active, completed, cancelled, archived
  ...baseColumns,
});

export type EventSelect = typeof events.$inferSelect;
export type EventInsert = typeof events.$inferInsert;
