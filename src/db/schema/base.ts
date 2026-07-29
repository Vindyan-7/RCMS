/**
 * Shared Database Base Table Schema Helper
 */

import { uuid, integer } from "drizzle-orm/pg-core";
import { timestampsColumns } from "./timestamps";
import { auditColumns } from "./audit";
import { softDeleteColumns } from "./soft-delete";

export const idColumn = {
  id: uuid("id").primaryKey().defaultRandom(),
};

/**
 * Reusable base columns incorporating UUID, Timestamps, Audit records, Soft deletes and Versioning
 */
export const baseColumns = {
  ...idColumn,
  ...timestampsColumns,
  ...auditColumns,
  ...softDeleteColumns,
  version: integer("version").default(1).notNull(),
};
