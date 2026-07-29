/**
 * RCMS Core Validation Schemas (Zod)
 */

import { z } from "zod";
import { REGEX_PATTERNS } from "../constants";

// Reusable primitive validations
export const uuidSchema = z.string().regex(REGEX_PATTERNS.UUID_V4, {
  message: "Invalid UUID format",
});

export const memberIdSchema = z.string().regex(REGEX_PATTERNS.MEMBER_ID, {
  message: "Invalid Member ID format (Expected: SAC-RC-YYNNN)",
});

export const rollNumberSchema = z.string().regex(REGEX_PATTERNS.ROLL_NUMBER, {
  message: "Invalid Roll Number format",
});

export const phoneSchema = z.string().regex(REGEX_PATTERNS.PHONE_NUMBER, {
  message: "Invalid Phone Number (Must be a valid 10-digit Indian mobile number)",
});

export const emailSchema = z.string().email({
  message: "Invalid email address format",
});

// Reusable pagination query schema
export const paginationQuerySchema = z.object({
  page: z.preprocess((val) => Number(val) || 1, z.number().int().min(1)).optional(),
  limit: z.preprocess((val) => Number(val) || 20, z.number().int().min(1).max(100)).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Reusable audit metadata schema
export const auditMetadataSchema = z.object({
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  actionReason: z.string().min(1, "Reason is required for this action").optional(),
});
