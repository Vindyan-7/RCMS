/**
 * Communication Domain - Notifications Schema Definition
 */

import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { members } from "./members";
import { users } from "./users";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 150 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("general").notNull(), // welcome, event_reminder, task_assigned, point_awarded, system
  channel: varchar("channel", { length: 20 }).default("in_app").notNull(), // in_app, email, whatsapp, push
  priority: varchar("priority", { length: 20 }).default("normal").notNull(), // low, normal, high, urgent
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, sent, delivered, failed
  scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "date" }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: "date" }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type NotificationSelect = typeof notifications.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;
