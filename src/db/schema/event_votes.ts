/**
 * Operations Domain - Event Votes Schema Definition
 */

import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { events } from "./events";
import { eventParticipants } from "./event_participants";
import { eventSubmissions } from "./event_submissions";

export const eventVotes = pgTable(
  "event_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    voterParticipantId: uuid("voter_participant_id")
      .notNull()
      .references(() => eventParticipants.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => eventSubmissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    eventVoterSubmissionUnq: unique("uq_event_votes_voter_submission").on(
      table.eventId,
      table.voterParticipantId,
      table.submissionId
    ),
  })
);

export type EventVoteSelect = typeof eventVotes.$inferSelect;
export type EventVoteInsert = typeof eventVotes.$inferInsert;
