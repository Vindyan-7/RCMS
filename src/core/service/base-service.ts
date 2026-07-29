/**
 * Generic Base Service Implementation
 */

import { UUID, PaginationQuery } from "../types";
import { IBaseService, IValidationPipeline } from "./service.types";
import { IBaseRepository, PaginatedResult } from "../repository/repository.types";
import { NotFoundError, BadRequestError } from "../errors";
import { logger } from "../logger";

export abstract class BaseService<T, TCreateInput, TUpdateInput>
  implements IBaseService<T, TCreateInput, TUpdateInput>
{
  /**
   * Base constructor allowing repository and validation pipeline injection
   *
   * @param repository Conforming instance of IBaseRepository
   * @param validator Optional input parser validating validation schema
   * @param serviceName Context tag for audit logs
   */
  constructor(
    protected readonly repository: IBaseRepository<T, TCreateInput, TUpdateInput>,
    protected readonly validator?: IValidationPipeline<TCreateInput | TUpdateInput>,
    protected readonly serviceName: string = "BaseService"
  ) {}

  public async getById(id: UUID): Promise<T> {
    logger.debug(`[${this.serviceName}] Fetching record by id`, { id });
    const record = await this.repository.findById(id);
    if (!record) {
      logger.warn(`[${this.serviceName}] Record not found`, { id });
      throw new NotFoundError(`Record with ID ${id} not found`);
    }
    return record;
  }

  public async list(query: PaginationQuery): Promise<PaginatedResult<T>> {
    logger.debug(`[${this.serviceName}] Querying record listing`, { query });
    return this.repository.findAll(query);
  }

  public async getAll(query: PaginationQuery): Promise<PaginatedResult<T>> {
    return this.list(query);
  }

  public async create(data: TCreateInput, actorId: UUID): Promise<T> {
    logger.info(`[${this.serviceName}] Processing create request`, { actorId });
    
    if (this.validator) {
      try {
        await this.validator.validate(data);
      } catch (err) {
        logger.warn(`[${this.serviceName}] Create validation failed`, { err });
        throw new BadRequestError(
          err instanceof Error ? err.message : "Validation failed during create pipeline"
        );
      }
    }
    
    return this.repository.create(data, actorId);
  }

  public async update(id: UUID, data: TUpdateInput, actorId: UUID): Promise<T> {
    logger.info(`[${this.serviceName}] Processing update request`, { id, actorId });

    // Validate existence first
    await this.getById(id);

    if (this.validator) {
      try {
        await this.validator.validate(data);
      } catch (err) {
        logger.warn(`[${this.serviceName}] Update validation failed`, { id, err });
        throw new BadRequestError(
          err instanceof Error ? err.message : "Validation failed during update pipeline"
        );
      }
    }

    return this.repository.update(id, data, actorId);
  }

  public async delete(id: UUID, actorId: UUID): Promise<boolean> {
    logger.info(`[${this.serviceName}] Processing soft delete request`, { id, actorId });
    
    // Validate existence first
    await this.getById(id);
    
    return this.repository.delete(id, actorId);
  }
}
export default BaseService;
