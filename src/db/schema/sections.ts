/**
 * Academic Sections Schema Definition
 */

import { pgTable, uuid, varchar, unique } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { branches } from "./branches";

export const sections = pgTable(
  "sections",
  {
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 10 }).notNull(),
    ...baseColumns,
  },
  (table) => ({
    branchSectionUnq: unique("sections_branch_name_uq").on(
      table.branchId,
      table.name
    ),
  })
);

export type SectionSelect = typeof sections.$inferSelect;
export type SectionInsert = typeof sections.$inferInsert;
