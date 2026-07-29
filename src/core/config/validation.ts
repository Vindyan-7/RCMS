/**
 * Shared Validation Rules & Constants Configurations
 */

import { REGEX_PATTERNS } from "../constants";

export const validationConfig = Object.freeze({
  passwordMinLength: 8,
  passwordPatternDescription: "Must contain uppercase, lowercase, numbers, and special symbols",
  
  patterns: {
    email: REGEX_PATTERNS.EMAIL,
    phone: REGEX_PATTERNS.PHONE_NUMBER,
    uuid: REGEX_PATTERNS.UUID_V4,
    memberId: REGEX_PATTERNS.MEMBER_ID,
  },
  
  volunteerCode: {
    length: 8,
    charset: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    expiryDurationSeconds: 3600, // 1 hour
  },
});

export type ValidationConfig = typeof validationConfig;
