/**
 * Volunteer Scanner Activation Codes Schema Definition
 */

import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { attendanceSessions } from "./attendance_sessions";
import { users } from "./users";

export const volunteerCodes = pgTable("volunteer_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => attendanceSessions.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 20 }).notNull().unique(),
  status: varchar("status", { length: 20 }).default("unused").notNull(), // unused, active, expired, revoked
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  activatedBy: uuid("activated_by").references(() => users.id, { onDelete: "restrict" }),
  activatedAt: timestamp("activated_at", { withTimezone: true, mode: "date" }),
});

export type VolunteerCodeSelect = typeof volunteerCodes.$inferSelect;
export type VolunteerCodeInsert = typeof volunteerCodes.$inferInsert;
