/**
 * Operations Domain - Task Completions Schema Definition
 */

import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { tasks } from "./tasks";
import { members } from "./members";
import { users } from "./users";

export const taskCompletions = pgTable(
  "task_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "restrict" }),
    completedBy: uuid("completed_by").references(() => users.id, { onDelete: "restrict" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    taskMemberUnq: unique("task_completions_task_member_uq").on(
      table.taskId,
      table.memberId
    ),
  })
);

export type TaskCompletionSelect = typeof taskCompletions.$inferSelect;
export type TaskCompletionInsert = typeof taskCompletions.$inferInsert;
