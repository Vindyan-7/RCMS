/**
 * Freshers Campaign Entries Schema Definition
 */

import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { freshersCampaigns } from "./freshers_campaigns";

export const freshersCampaignEntries = pgTable("freshers_campaign_entries", {
  campaignId: uuid("campaign_id").references(() => freshersCampaigns.id, { onDelete: "restrict" }).notNull(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  mobileNumber: varchar("mobile_number", { length: 20 }).notNull(),
  normalizedMobile: varchar("normalized_mobile", { length: 20 }).notNull(),
  stallRating: integer("stall_rating").notNull(), // 1 to 5
  feedback: text("feedback"),
  status: varchar("status", { length: 20 }).default("registered").notNull(), // registered, contacted, converted, rejected
  drawStatus: varchar("draw_status", { length: 20 }).default("eligible").notNull(), // eligible, winner, excluded
  prizeTier: varchar("prize_tier", { length: 50 }),
  winnerPosition: integer("winner_position"),
  drawnAt: timestamp("drawn_at", { withTimezone: true }),
  drawnBy: uuid("drawn_by"),
  ...baseColumns,
});

export type FreshersCampaignEntrySelect = typeof freshersCampaignEntries.$inferSelect;
export type FreshersCampaignEntryInsert = typeof freshersCampaignEntries.$inferInsert;
