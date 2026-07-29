/**
 * Attendance Sessions Schema Definition
 */

import { pgTable, uuid, varchar, date, time, integer } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const attendanceSessions = pgTable("attendance_sessions", {
  title: varchar("title", { length: 100 }).notNull(),
  date: date("date", { mode: "date" }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  attendancePoints: integer("attendance_points").default(10).notNull(),
  lateThreshold: integer("late_threshold").default(15).notNull(), // Minutes
  latePoints: integer("late_points").default(5).notNull(),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, scheduled, active, paused, closed, archived
  ...baseColumns,
});

export type AttendanceSessionSelect = typeof attendanceSessions.$inferSelect;
export type AttendanceSessionInsert = typeof attendanceSessions.$inferInsert;
