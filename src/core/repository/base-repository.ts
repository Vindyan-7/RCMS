/**
 * Abstract Base Repository Class
 */

import { UUID, PaginationQuery } from "../types";
import { IBaseRepository, QueryOptions, PaginatedResult } from "./repository.types";

export abstract class BaseRepository<T, TCreateInput, TUpdateInput>
  implements IBaseRepository<T, TCreateInput, TUpdateInput>
{
  protected abstract getTableName(): string;

  abstract findById(id: UUID, options?: { includeDeleted?: boolean }): Promise<T | null>;

  abstract findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>>;

  abstract create(data: TCreateInput, creatorId: UUID): Promise<T>;

  abstract update(id: UUID, data: TUpdateInput, updaterId: UUID): Promise<T>;

  abstract delete(id: UUID, deleterId: UUID): Promise<boolean>;

  abstract purge(id: UUID): Promise<boolean>;

  /**
   * Reusable helper to calculate total pages from record count and page size limit
   */
  protected calculateTotalPages(total: number, limit: number): number {
    return Math.max(1, Math.ceil(total / limit));
  }

  /**
   * Shared audit mapping context utility
   */
  protected getAuditFields(userId: UUID, action: "create" | "update") {
    const timestamp = new Date();
    if (action === "create") {
      return {
        createdBy: userId,
        updatedBy: userId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }
    return {
      updatedBy: userId,
      updatedAt: timestamp,
    };
  }
}
export default BaseRepository;
