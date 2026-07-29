/**
 * Finance Domain - Sponsors Schema Definition
 */

import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const sponsors = pgTable("sponsors", {
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).default("organization").notNull(), // organization, individual, alumni, industry_partner
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  notes: text("notes"),
  ...baseColumns,
});

export type SponsorSelect = typeof sponsors.$inferSelect;
export type SponsorInsert = typeof sponsors.$inferInsert;
