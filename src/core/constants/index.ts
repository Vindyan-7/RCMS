/**
 * RCMS Core Constants
 */

export const APP_CONSTANTS = {
  CLUB_NAME: "SAC Robotics Club",
  ORGANIZATION_NAME: "Student Activities Committee",
  SYSTEM_TZ: "Asia/Kolkata",
  DEFAULT_LOCALE: "en-IN",
} as const;

export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_ORDER: "desc" as const,
} as const;

export const DATE_TIME_FORMATS = {
  DATE_ISO: "YYYY-MM-DD",
  DATE_DISPLAY: "DD-MM-YYYY",
  TIME_24H: "HH:mm",
  TIME_DISPLAY: "hh:mm A",
  DATE_TIME_DISPLAY: "DD-MM-YYYY hh:mm A",
} as const;

export const FILE_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE_BYTES: 2 * 1024 * 1024, // 2MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const REGEX_PATTERNS = {
  // Matches e.g., SAC-RC-26001
  MEMBER_ID: /^SAC-RC-\d{2}\d{3}$/,
  // Standard Indian roll number patterns (alpha-numeric)
  ROLL_NUMBER: /^[A-Za-z0-9\-\/]{5,20}$/,
  // 10-digit Indian phone number
  PHONE_NUMBER: /^[6-9]\d{9}$/,
  // Standard email validation regex
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // UUID v4 format
  UUID_V4: /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

export const API_CONSTANTS = {
  BASE_PREFIX: "/api",
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
} as const;

export const ENV_CONSTANTS = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
} as const;
