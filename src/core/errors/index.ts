/**
 * Centralized Error Handling Classes & Helpers
 */

import { API_CONSTANTS } from "../constants";
import { ApiResponse } from "../types";

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: unknown;

  constructor(code: string, message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * HTTP 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message: string, code: string = "BAD_REQUEST", details?: unknown) {
    super(code, message, API_CONSTANTS.STATUS_CODES.BAD_REQUEST, details);
  }
}

/**
 * HTTP 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required", code: string = "UNAUTHORIZED") {
    super(code, message, API_CONSTANTS.STATUS_CODES.UNAUTHORIZED);
  }
}

/**
 * HTTP 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied", code: string = "FORBIDDEN") {
    super(code, message, API_CONSTANTS.STATUS_CODES.FORBIDDEN);
  }
}

/**
 * HTTP 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(message: string, code: string = "NOT_FOUND") {
    super(code, message, API_CONSTANTS.STATUS_CODES.NOT_FOUND);
  }
}

/**
 * HTTP 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string, code: string = "CONFLICT") {
    super(code, message, 409);
  }
}

/**
 * HTTP 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error", details?: unknown) {
    super("INTERNAL_SERVER_ERROR", message, API_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR, details);
  }
}

/**
 * Formats an unknown error or AppError into a standard ApiResponse structure
 */
export function formatErrorResponse(error: unknown): ApiResponse<never> {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  return {
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
    },
  };
}
