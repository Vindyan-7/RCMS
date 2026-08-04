import { pgTable, uuid, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { members } from "./members";

export const memberCollaborations = pgTable(
  "member_collaborations",
  {
    memberAId: uuid("member_a_id")
      .notNull()
      .references(() => members.id),
    memberBId: uuid("member_b_id")
      .notNull()
      .references(() => members.id),
    timesWorkedTogether: integer("times_worked_together").default(1).notNull(),
    lastGenerationId: text("last_generation_id"),
    lastAttendanceSessionId: uuid("last_attendance_session_id"),
    lastCollaboratedAt: timestamp("last_collaborated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...baseColumns,
  },
  (table) => ({
    canonicalPairIdx: uniqueIndex("member_collaborations_pair_idx").on(
      table.memberAId,
      table.memberBId
    ),
  })
);
