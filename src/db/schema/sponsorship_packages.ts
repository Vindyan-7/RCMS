/**
 * Finance Domain - Sponsorship Packages Schema Definition
 */

import { pgTable, uuid, varchar, text, integer } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const sponsorshipPackages = pgTable("sponsorship_packages", {
  name: varchar("name", { length: 100 }).notNull(),
  tier: varchar("tier", { length: 20 }).default("gold").notNull(), // bronze, silver, gold, platinum, custom
  amount: integer("amount").notNull(),
  durationMonths: integer("duration_months").default(12).notNull(),
  benefits: text("benefits"),
  ...baseColumns,
});

export type SponsorshipPackageSelect = typeof sponsorshipPackages.$inferSelect;
export type SponsorshipPackageInsert = typeof sponsorshipPackages.$inferInsert;
