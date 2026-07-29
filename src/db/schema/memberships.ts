/**
 * Membership Schema Definition (Semester-Specific Participation)
 */

import { pgTable, uuid, varchar, date, unique } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { members } from "./members";
import { academicYears } from "./academic_years";
import { semesters } from "./semesters";
import { roles } from "./roles";

export const memberships = pgTable(
  "memberships",
  {
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    academicYearId: uuid("academic_year_id")
      .notNull()
      .references(() => academicYears.id, { onDelete: "restrict" }),
    semesterId: uuid("semester_id")
      .notNull()
      .references(() => semesters.id, { onDelete: "restrict" }),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    joinDate: date("join_date", { mode: "date" }).defaultNow().notNull(),
    exitDate: date("exit_date", { mode: "date" }),
    ...baseColumns,
  },
  (table) => ({
    memberSemesterUnq: unique("memberships_member_year_sem_uq").on(
      table.memberId,
      table.academicYearId,
      table.semesterId
    ),
  })
);

export type MembershipSelect = typeof memberships.$inferSelect;
export type MembershipInsert = typeof memberships.$inferInsert;
