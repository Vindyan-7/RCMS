/**
 * Finance Domain - Sponsorship Agreements Schema Definition
 */

import { pgTable, uuid, timestamp, varchar, integer, text } from "drizzle-orm/pg-core";
import { sponsors } from "./sponsors";
import { sponsorshipPackages } from "./sponsorship_packages";
import { baseColumns } from "./base";

export const sponsorshipAgreements = pgTable("sponsorship_agreements", {
  sponsorId: uuid("sponsor_id")
    .notNull()
    .references(() => sponsors.id, { onDelete: "restrict" }),
  packageId: uuid("package_id").references(() => sponsorshipPackages.id, { onDelete: "restrict" }),
  startDate: timestamp("start_date", { withTimezone: true, mode: "date" }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true, mode: "date" }).notNull(),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // draft, pending, active, completed, cancelled
  notes: text("notes"),
  ...baseColumns,
});

export type SponsorshipAgreementSelect = typeof sponsorshipAgreements.$inferSelect;
export type SponsorshipAgreementInsert = typeof sponsorshipAgreements.$inferInsert;
