/**
 * Shared Database Audit Columns
 */

import { uuid } from "drizzle-orm/pg-core";

export const auditColumns = {
  createdBy: uuid("created_by").notNull(),
  updatedBy: uuid("updated_by").notNull(),
};
