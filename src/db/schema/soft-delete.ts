/**
 * Shared Database Soft Delete Columns
 */

import { timestamp, uuid } from "drizzle-orm/pg-core";

export const softDeleteColumns = {
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  deletedBy: uuid("deleted_by"),
};
