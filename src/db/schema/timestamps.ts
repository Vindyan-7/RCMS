/**
 * Shared Database Timestamps Columns
 */

import { timestamp } from "drizzle-orm/pg-core";

export const timestampsColumns = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
};
