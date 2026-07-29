/**
 * Inventory Domain - Inventory Items Schema Definition
 */

import { pgTable, uuid, varchar, text, integer } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const inventoryItems = pgTable("inventory_items", {
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // components, tools, kits, microcontrollers, sensors, hardware
  quantity: integer("quantity").notNull().default(1),
  available: integer("available").notNull().default(1),
  condition: varchar("condition", { length: 20 }).default("good").notNull(), // good, damaged, under_maintenance, retired
  location: varchar("location", { length: 100 }),
  remarks: text("remarks"),
  ...baseColumns,
});

export type InventoryItemSelect = typeof inventoryItems.$inferSelect;
export type InventoryItemInsert = typeof inventoryItems.$inferInsert;
