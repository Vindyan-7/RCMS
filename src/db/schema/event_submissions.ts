/**
 * Operations Domain - Event Submissions Schema Definition
 */

import { pgTable, uuid, varchar, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { events } from "./events";
import { eventParticipants } from "./event_participants";

export const eventSubmissions = pgTable(
  "event_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => eventParticipants.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }).notNull(),
    description: text("description").notNull(),
    status: varchar("status", { length: 20 }).default("submitted").notNull(), // 'draft', 'submitted', 'published', 'rejected', 'hidden'
    adminFeedback: text("admin_feedback"),
    winnerRank: integer("winner_rank"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    eventParticipantUnq: unique("uq_event_submissions_participant").on(table.eventId, table.participantId),
  })
);

export type EventSubmissionSelect = typeof eventSubmissions.$inferSelect;
export type EventSubmissionInsert = typeof eventSubmissions.$inferInsert;
