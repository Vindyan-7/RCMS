/**
 * Freshers Campaigns Schema Definition
 */

import { pgTable, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const freshersCampaigns = pgTable("freshers_campaigns", {
  campaignKey: varchar("campaign_key", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("active").notNull(), // draft, active, closed
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  configuration: jsonb("configuration").default({}),
  ...baseColumns,
});

export type FreshersCampaignSelect = typeof freshersCampaigns.$inferSelect;
export type FreshersCampaignInsert = typeof freshersCampaigns.$inferInsert;
