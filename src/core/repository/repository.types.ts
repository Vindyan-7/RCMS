/**
 * Shared Repository Layer Types & Interfaces
 */

import { UUID, PaginationQuery } from "../types";

export interface QueryOptions {
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean;
  includeCount?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Base Repository Interface (CRUD Abstraction)
 */
export interface IBaseRepository<T, TCreateInput, TUpdateInput> {
  findById(id: UUID, options?: { includeDeleted?: boolean }): Promise<T | null>;
  
  findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>>;
  
  create(data: TCreateInput, creatorId: UUID): Promise<T>;
  
  update(id: UUID, data: TUpdateInput, updaterId: UUID): Promise<T>;
  
  delete(id: UUID, deleterId: UUID): Promise<boolean>; // Soft delete
  
  purge(id: UUID): Promise<boolean>; // Hard delete (restricted admin usage)
}

/**
 * Transaction interface wrapper placeholder
 */
export interface ITransactionContext {
  transactionId: UUID;
  execute<R>(work: (tx: any) => Promise<R>): Promise<R>;
}
