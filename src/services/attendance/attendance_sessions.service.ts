/**
 * Attendance Domain - Attendance Sessions Service Implementation
 */

import { BaseService } from "@/core/service/base-service";
import { AttendanceSessionsRepository } from "@/repositories/attendance/attendance_sessions.repository";
import { AttendanceSessionSelect, AttendanceSessionInsert } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { NotFoundError, BadRequestError } from "@/core/errors";
import { logger } from "@/core/logger";

export class AttendanceSessionsService extends BaseService<
  AttendanceSessionSelect,
  AttendanceSessionInsert,
  Partial<AttendanceSessionInsert>
> {
  constructor(private readonly sessionsRepo: AttendanceSessionsRepository) {
    super(sessionsRepo, undefined, "AttendanceSessionsService");
  }

  public async createSession(
    data: any,
    actorId: UUID
  ): Promise<AttendanceSessionSelect> {
    logger.info("[AttendanceSessionsService] Creating attendance session", {
      title: data.title,
      actorId,
    });
    return this.sessionsRepo.create(data, actorId);
  }

  public async openSession(id: UUID, actorId: UUID): Promise<AttendanceSessionSelect> {
    logger.info("[AttendanceSessionsService] Opening attendance session", { id, actorId });
    const session = await this.getById(id);
    if (session.status === "closed" || session.status === "archived") {
      throw new BadRequestError(`Cannot open session ${id} with status ${session.status}`);
    }
    return this.sessionsRepo.update(id, { status: "active" }, actorId);
  }

  public async pauseSession(id: UUID, actorId: UUID): Promise<AttendanceSessionSelect> {
    logger.info("[AttendanceSessionsService] Pausing attendance session", { id, actorId });
    await this.getById(id);
    return this.sessionsRepo.update(id, { status: "paused" }, actorId);
  }

  public async closeSession(id: UUID, actorId: UUID): Promise<AttendanceSessionSelect> {
    logger.info("[AttendanceSessionsService] Closing attendance session", { id, actorId });
    await this.getById(id);
    return this.sessionsRepo.update(id, { status: "closed" }, actorId);
  }

  public async lockSession(id: UUID, actorId: UUID): Promise<AttendanceSessionSelect> {
    logger.info("[AttendanceSessionsService] Locking attendance session", { id, actorId });
    await this.getById(id);
    return this.sessionsRepo.update(id, { status: "archived" }, actorId);
  }

  public async getActiveSessions(pagination: PaginationQuery): Promise<PaginatedResult<AttendanceSessionSelect>> {
    return this.sessionsRepo.findAll(pagination);
  }
}
