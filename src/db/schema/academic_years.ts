/**
 * Academic Years Schema Definition
 */

import { pgTable, uuid, varchar, date } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const academicYears = pgTable("academic_years", {
  name: varchar("name", { length: 20 }).notNull().unique(),
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  ...baseColumns,
});

export type AcademicYearSelect = typeof academicYears.$inferSelect;
export type AcademicYearInsert = typeof academicYears.$inferInsert;
