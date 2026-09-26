/**
 * Operations Domain - Events Schema Definition
 */

import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const events = pgTable("events", {
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  venue: varchar("venue", { length: 100 }),
  startDate: timestamp("start_date", { withTimezone: true, mode: "date" }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true, mode: "date" }).notNull(),
  points: integer("points").default(20).notNull(),
  status: varchar("status", { length: 20 }).default("upcoming").notNull(), // upcoming, active, completed, cancelled, archived
  
  // Competition & Challenge configuration
  submissionStartAt: timestamp("submission_start_at", { withTimezone: true, mode: "date" }),
  submissionEndAt: timestamp("submission_end_at", { withTimezone: true, mode: "date" }),
  minImages: integer("min_images").default(1),
  maxImages: integer("max_images").default(2),
  minDescriptionChars: integer("min_description_chars").default(100),
  votingState: varchar("voting_state", { length: 20 }).default("NOT_STARTED").notNull(), // NOT_STARTED, ACTIVE, PAUSED, CLOSED
  votingStartAt: timestamp("voting_start_at", { withTimezone: true, mode: "date" }),
  votingEndAt: timestamp("voting_end_at", { withTimezone: true, mode: "date" }),
  votesPerParticipant: integer("votes_per_participant").default(1).notNull(),
  selfVotingAllowed: boolean("self_voting_allowed").default(false).notNull(),
  showVoteCounts: boolean("show_vote_counts").default(false).notNull(),
  numberOfWinners: integer("number_of_winners").default(1).notNull(),
  winnersFinalized: boolean("winners_finalized").default(false).notNull(),
  winnersFinalizedAt: timestamp("winners_finalized_at", { withTimezone: true, mode: "date" }),
  coverImageUrl: text("cover_image_url"),
  isCompetition: boolean("is_competition").default(true).notNull(),

  // Points & Rewards configuration
  submissionPoints: integer("submission_points").default(100).notNull(),
  votingPercentage: integer("voting_percentage").default(40).notNull(),

  ...baseColumns,
});

export type EventSelect = typeof events.$inferSelect;
export type EventInsert = typeof events.$inferInsert;
