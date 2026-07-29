/**
 * Semesters Schema Definition
 */

import { pgTable, uuid, varchar, date } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { academicYears } from "./academic_years";

export const semesters = pgTable("semesters", {
  academicYearId: uuid("academic_year_id")
    .notNull()
    .references(() => academicYears.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 50 }).notNull(),
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  ...baseColumns,
});

export type SemesterSelect = typeof semesters.$inferSelect;
export type SemesterInsert = typeof semesters.$inferInsert;
