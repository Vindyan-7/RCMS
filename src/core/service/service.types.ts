/**
 * Shared Service Layer Types & Interfaces
 */

import { UUID, PaginationQuery } from "../types";
import { PaginatedResult } from "../repository/repository.types";

/**
 * Generic Base Service Contract
 */
export interface IBaseService<T, TCreateInput, TUpdateInput> {
  getById(id: UUID): Promise<T>;
  
  list(query: PaginationQuery): Promise<PaginatedResult<T>>;
  
  create(data: TCreateInput, actorId: UUID): Promise<T>;
  
  update(id: UUID, data: TUpdateInput, actorId: UUID): Promise<T>;
  
  delete(id: UUID, actorId: UUID): Promise<boolean>;
}

/**
 * Validation Pipeline contract for services to parse raw inputs
 */
export interface IValidationPipeline<TInput> {
  validate(data: unknown): Promise<TInput>;
}
