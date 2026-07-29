/**
 * Operations Domain - Event Participations Schema Definition
 */

import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { events } from "./events";
import { members } from "./members";
import { users } from "./users";

export const eventParticipations = pgTable(
  "event_participations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "restrict" }),
    verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "restrict" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    eventMemberUnq: unique("event_participations_event_member_uq").on(
      table.eventId,
      table.memberId
    ),
  })
);

export type EventParticipationSelect = typeof eventParticipations.$inferSelect;
export type EventParticipationInsert = typeof eventParticipations.$inferInsert;
