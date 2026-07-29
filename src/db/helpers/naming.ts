/**
 * Database Naming & Schema Constraint Helpers
 */

export const CONSTRAINTS = {
  /**
   * Helper to format standard constraint keys for tables.
   * Format: const_tablename_columnname_type
   */
  formatKey(table: string, column: string, type: "pk" | "fk" | "uq" | "idx"): string {
    const cleanTable = table.toLowerCase().replace(/[^a-z0-9_]/g, "");
    const cleanColumn = column.toLowerCase().replace(/[^a-z0-9_]/g, "");
    return `${cleanTable}_${cleanColumn}_${type}`;
  },
};
