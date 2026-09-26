/**
 * Operations Domain - Event Participants Schema Definition
 * Canonical event participant identity: Official Member or Fresher/New Participant
 */

import { pgTable, uuid, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { events } from "./events";
import { members } from "./members";

export const eventParticipants = pgTable(
  "event_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    participantType: varchar("participant_type", { length: 20 }).notNull(), // 'member' | 'fresher'
    memberId: uuid("member_id").references(() => members.id, { onDelete: "restrict" }),
    fresherName: varchar("fresher_name", { length: 100 }),
    mobileNumber: varchar("mobile_number", { length: 20 }),
    normalizedMobile: varchar("normalized_mobile", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    eventMemberUnq: unique("uq_event_participants_member").on(table.eventId, table.memberId),
    eventMobileUnq: unique("uq_event_participants_fresher").on(table.eventId, table.normalizedMobile),
  })
);

export type EventParticipantSelect = typeof eventParticipants.$inferSelect;
export type EventParticipantInsert = typeof eventParticipants.$inferInsert;
