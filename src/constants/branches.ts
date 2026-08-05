/**
 * RCMS Centralized Branch Registry — Single Source of Truth
 * Official Robotics Club branch list used across all UI components, filters,
 * analytics, reports, team studio algorithms, and member creation.
 */

export const RCMS_BRANCHES = [
  "CSE",
  "CSM",
  "CSD",
  "CSC",
  "IT",
  "ECE",
  "EEE",
  "MEC",
  "Civil",
  "MBA",
  "MCA",
] as const;

export type RcmsBranch = (typeof RCMS_BRANCHES)[number];

/**
 * Normalizes any raw branch string into the standardized RCMS Branch format.
 */
export function normalizeBranch(rawBranch?: string | null): string {
  if (!rawBranch || !rawBranch.trim()) return "CSE";
  const b = rawBranch.trim().toUpperCase();

  // Match exact or common aliases
  if (b === "CSE" || b.includes("COMPUTER SCIENCE &") || b.includes("COMPUTER SCIENCE AND")) return "CSE";
  if (b === "CSM" || b.includes("ARTIFICIAL INTELLIGENCE") || b.includes("AI & ML") || b.includes("AIML")) return "CSM";
  if (b === "CSD" || b.includes("DATA SCIENCE")) return "CSD";
  if (b === "CSC" || b.includes("CYBER SECURITY") || b.includes("CYBERSECURITY")) return "CSC";
  if (b === "IT" || b.includes("INFORMATION TECHNOLOGY")) return "IT";
  if (b === "ECE" || b.includes("ELECTRONICS")) return "ECE";
  if (b === "EEE" || b.includes("ELECTRICAL")) return "EEE";
  if (b === "MEC" || b === "MECH" || b.includes("MECHANICAL")) return "MEC";
  if (b === "CIVIL" || b.includes("CIVIL")) return "Civil";
  if (b === "MBA" || b.includes("BUSINESS ADMINISTRATION")) return "MBA";
  if (b === "MCA" || b.includes("COMPUTER APPLICATIONS")) return "MCA";

  // Check direct match in RCMS_BRANCHES (case-insensitive)
  const direct = RCMS_BRANCHES.find((item) => item.toUpperCase() === b);
  return direct || b;
}
