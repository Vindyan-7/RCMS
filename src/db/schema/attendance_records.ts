/**
 * Attendance Records Schema Definition
 */

import { pgTable, uuid, timestamp, integer, boolean, varchar, text, unique } from "drizzle-orm/pg-core";
import { members } from "./members";
import { attendanceSessions } from "./attendance_sessions";
import { users } from "./users";

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "restrict" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: "restrict" }),
    scanTime: timestamp("scan_time", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    points: integer("points").notNull(),
    late: boolean("late").default(false).notNull(),
    volunteerUser: uuid("volunteer_user").references(() => users.id, { onDelete: "restrict" }),
    method: varchar("method", { length: 20 }).default("qr").notNull(), // qr, manual
    remarks: text("remarks"),
  },
  (table) => ({
    memberSessionUnq: unique("attendance_records_member_session_uq").on(
      table.memberId,
      table.sessionId
    ),
  })
);

export type AttendanceRecordSelect = typeof attendanceRecords.$inferSelect;
export type AttendanceRecordInsert = typeof attendanceRecords.$inferInsert;
