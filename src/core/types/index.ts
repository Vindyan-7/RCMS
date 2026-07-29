/**
 * RCMS Core Types
 */

export type UUID = string;

export type Timestamp = string; // ISO-8601 string representation

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type PaginationQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
};

export type ApiErrorResponse = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiMetadata = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
  metadata?: ApiMetadata;
};

export type AuditMetadata = {
  ipAddress?: string;
  userAgent?: string;
  actionReason?: string;
};
