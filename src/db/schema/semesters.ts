/**
 * Semesters Schema Definition
 */

import { pgTable, varchar, date } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { academicYears } from "./academic_years";
import { uuid } from "drizzle-orm/pg-core";

export const semesters = pgTable("semesters", {
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 50 }).notNull(),
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }).notNull(),
  registrationStart: date("registration_start", { mode: "date" }),
  registrationEnd: date("registration_end", { mode: "date" }),
  // upcoming | active | completed
  status: varchar("status", { length: 20 }).default("upcoming").notNull(),
  ...baseColumns,
});

export type SemesterSelect = typeof semesters.$inferSelect;
export type SemesterInsert = typeof semesters.$inferInsert;
