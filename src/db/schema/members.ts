/**
 * Permanent Member Identity Schema Definition
 */

import { pgTable, uuid, varchar, text, integer } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { branches } from "./branches";

export const members = pgTable("members", {
  memberId: varchar("member_id", { length: 20 }).notNull().unique(),
  rollNumber: varchar("roll_number", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 15 }).notNull(),
  gender: varchar("gender", { length: 20 }),
  photoUrl: text("photo_url"),
  avatarUrl: text("avatar_url"),
  branchId: uuid("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  branch: varchar("branch", { length: 100 }),
  year: integer("year"),
  academicYearId: uuid("academic_year_id"),
  academicYear: varchar("academic_year", { length: 50 }),
  joinedDate: text("joined_date"),
  clubMembershipId: varchar("club_membership_id", { length: 50 }),
  role: varchar("role", { length: 50 }).default("Member"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  ...baseColumns,
});

export type MemberSelect = typeof members.$inferSelect;
export type MemberInsert = typeof members.$inferInsert;
