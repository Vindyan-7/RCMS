/**
 * Communication Domain - Notification Templates Schema Definition
 */

import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const notificationTemplates = pgTable("notification_templates", {
  code: varchar("code", { length: 50 }).notNull().unique(), // welcome_email, event_reminder, task_assigned
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 150 }),
  templateText: text("template_text").notNull(),
  channel: varchar("channel", { length: 20 }).default("in_app").notNull(),
  description: text("description"),
  ...baseColumns,
});

export type NotificationTemplateSelect = typeof notificationTemplates.$inferSelect;
export type NotificationTemplateInsert = typeof notificationTemplates.$inferInsert;
