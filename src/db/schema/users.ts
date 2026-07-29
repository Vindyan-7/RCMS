/**
 * Administrative Users Schema Definition
 */

import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { roles } from "./roles";

export const users = pgTable("users", {
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "restrict" }),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  lastLogin: timestamp("last_login", { withTimezone: true, mode: "date" }),
  ...baseColumns,
});

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
