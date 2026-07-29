/**
 * Centralized ID Strategy & Documentation
 *
 * RCMS enforces strict formats for both internal and external identifier keys.
 * Standard Identifier Formats:
 *
 * 1. Internal Keys (Database Primary Keys):
 *    - Schema UUID: Standard RFC 4122 version 4 UUID.
 *    - Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * 2. External Member ID:
 *    - Format: SAC-RC-YYNNN
 *    - Description: Club Identifier prefix (SAC-RC), followed by Year prefix (YY) and a 3-digit zero-padded sequence (NNN).
 *    - Example: SAC-RC-26001 (First member added in Academic Year 2026-27).
 *
 * 3. Academic Year ID:
 *    - Format: YYYY-YY
 *    - Example: 2026-27
 *
 * 4. Semester ID:
 *    - Format: SEM-N
 *    - Example: SEM-1, SEM-2
 */

import { REGEX_PATTERNS } from "../constants";

export const ID_STRATEGY = {
  isValidUuid(id: string): boolean {
    return REGEX_PATTERNS.UUID_V4.test(id);
  },

  isValidMemberId(id: string): boolean {
    return REGEX_PATTERNS.MEMBER_ID.test(id);
  },

  /**
   * Helper to format an external Member ID given a year and sequence number.
   * Format: SAC-RC-YYNNN
   *
   * @param yearPrefix Two digit year prefix, e.g., 26 for year 2026
   * @param sequence 1-indexed sequence number
   * @returns formatted external ID string
   */
  formatMemberId(yearPrefix: number, sequence: number): string {
    const cleanYear = String(yearPrefix).slice(-2).padStart(2, "0");
    const cleanSeq = String(sequence).padStart(3, "0");
    return `SAC-RC-${cleanYear}${cleanSeq}`;
  },

  /**
   * Helper to format an academic year string.
   * Format: YYYY-YY
   *
   * @param startYear e.g., 2026
   * @returns formatted academic year ID, e.g., 2026-27
   */
  formatAcademicYear(startYear: number): string {
    const endYearShort = String(startYear + 1).slice(-2);
    return `${startYear}-${endYearShort}`;
  },
};
