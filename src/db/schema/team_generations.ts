import { pgTable, uuid, text, integer } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { attendanceSessions } from "./attendance_sessions";
import { semesters } from "./semesters";

export const teamGenerations = pgTable("team_generations", {
  attendanceSessionId: uuid("attendance_session_id")
    .notNull()
    .references(() => attendanceSessions.id),
  semesterId: uuid("semester_id").references(() => semesters.id),
  algorithm: text("algorithm").notNull(),
  teamSize: integer("team_size").notNull(),
  totalTeams: integer("total_teams").notNull(),
  totalMembers: integer("total_members").notNull(),
  generatedBy: text("generated_by").notNull(),
  ...baseColumns,
});
