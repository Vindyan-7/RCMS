/**
 * Points Domain - Immutable Points Ledger Schema Definition
 */

import { pgTable, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { members } from "./members";
import { users } from "./users";

import { semesters } from "./semesters";

export const pointsLedger = pgTable("points_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "restrict" }),
  category: varchar("category", { length: 50 }).notNull(), // attendance, event, task, volunteer, manual, penalty
  referenceType: varchar("reference_type", { length: 50 }), // attendance_records, task_completions, event_participations, manual
  referenceId: uuid("reference_id"),
  semesterId: uuid("semester_id").references(() => semesters.id, { onDelete: "restrict" }),
  points: integer("points").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  remarks: text("remarks"),
});

export type PointsLedgerSelect = typeof pointsLedger.$inferSelect;
export type PointsLedgerInsert = typeof pointsLedger.$inferInsert;
