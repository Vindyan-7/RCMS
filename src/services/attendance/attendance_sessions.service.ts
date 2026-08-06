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

import { SemesterContextService } from "@/services/academic/semester-context.service";

export class AttendanceSessionsService extends BaseService<
  AttendanceSessionSelect,
  AttendanceSessionInsert,
  Partial<AttendanceSessionInsert>
> {
  constructor(
    private readonly sessionsRepo: AttendanceSessionsRepository,
    private readonly semesterContextService: SemesterContextService = new SemesterContextService()
  ) {
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
    // Operational Rule: Validate active semester exists and inherit its ID automatically
    const activeSemester = await this.semesterContextService.ensureActiveSemester("Attendance session creation");

    const sessionDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isLive = data.status === "upcoming" || data.status === "scheduled" || data.status === "active";
    const isLate = data.status === "completed" || data.status === "closed";

    if (isLive) {
      const targetDate = new Date(sessionDate);
      targetDate.setHours(0, 0, 0, 0);
      if (targetDate < today) {
        throw new BadRequestError("Live Attendance sessions cannot be created for past dates. For past sessions, please select 'Late Attendance'.");
      }
    } else if (isLate) {
      const semStart = activeSemester.startDate ? new Date(activeSemester.startDate) : null;
      const semEnd = activeSemester.endDate ? new Date(activeSemester.endDate) : null;

      if (semStart) semStart.setHours(0, 0, 0, 0);
      if (semEnd) semEnd.setHours(23, 59, 59, 999);

      if (semStart && sessionDate < semStart) {
        throw new BadRequestError(`Late Attendance date cannot be earlier than Active Semester start date (${activeSemester.startDate}).`);
      }
      if (semEnd && sessionDate > semEnd) {
        throw new BadRequestError(`Late Attendance date cannot be later than Active Semester end date (${activeSemester.endDate}).`);
      }
    }

    const payload = {
      ...data,
      semesterId: activeSemester.id,
    };
    return this.sessionsRepo.create(payload, actorId);
  }

  public async openSession(id: UUID, actorId: UUID): Promise<AttendanceSessionSelect> {
    logger.info("[AttendanceSessionsService] Opening attendance session", { id, actorId });
    await this.semesterContextService.ensureActiveSemester("Opening attendance session");
    const session = await this.getById(id);
    if (session.status === "closed" || session.status === "completed" || session.status === "archived") {
      throw new BadRequestError(`Cannot open a session that is already ${session.status}.`);
    }
    return this.sessionsRepo.update(id, { status: "active" }, actorId);
  }

  public async pauseSession(id: UUID, actorId: UUID): Promise<AttendanceSessionSelect> {
    logger.info("[AttendanceSessionsService] Pausing attendance session", { id, actorId });
    const session = await this.getById(id);
    if (session.status !== "active") {
      throw new BadRequestError(`Only active live sessions can be paused.`);
    }
    return this.sessionsRepo.update(id, { status: "paused" }, actorId);
  }

  public async closeSession(id: UUID, actorId: UUID): Promise<AttendanceSessionSelect> {
    logger.info("[AttendanceSessionsService] Closing attendance session", { id, actorId });
    const session = await this.getById(id);
    if (session.status === "closed" || session.status === "completed" || session.status === "archived") {
      throw new BadRequestError(`Session is already ${session.status}.`);
    }
    return this.sessionsRepo.update(id, { status: "completed" }, actorId);
  }

  public async archiveSession(id: UUID, actorId: UUID): Promise<AttendanceSessionSelect> {
    logger.info("[AttendanceSessionsService] Archiving attendance session and reversing points", { id, actorId });
    const session = await this.getById(id);
    if (session.status === "archived") {
      throw new BadRequestError(`Session "${session.title}" is already archived.`);
    }
    if (session.status !== "completed" && session.status !== "closed") {
      throw new BadRequestError(`Only completed attendance sessions can be archived. Current status: ${session.status}`);
    }

    const updatedSession = await this.sessionsRepo.update(id, { status: "archived" }, actorId);

    try {
      const { PointsLedgerRepository } = require("@/repositories/points/points_ledger.repository");
      const pointsLedgerRepo = new PointsLedgerRepository();
      const revokedCount = await pointsLedgerRepo.revokePointsForSession(id, actorId);
      logger.info("[AttendanceSessionsService] Revoked session points for archival", { id, revokedCount });
    } catch (err) {
      logger.error("[AttendanceSessionsService] Error revoking points during archival", err);
    }

    return updatedSession;
  }

  public async restoreSession(id: UUID, actorId: UUID): Promise<AttendanceSessionSelect> {
    logger.info("[AttendanceSessionsService] Restoring attendance session and points", { id, actorId });
    const session = await this.getById(id);
    if (session.status !== "archived") {
      throw new BadRequestError(`Only archived sessions can be restored. Current status: ${session.status}`);
    }

    const updatedSession = await this.sessionsRepo.update(id, { status: "completed" }, actorId);

    try {
      const { PointsLedgerRepository } = require("@/repositories/points/points_ledger.repository");
      const pointsLedgerRepo = new PointsLedgerRepository();
      const restoredCount = await pointsLedgerRepo.restorePointsForSession(id, actorId);
      logger.info("[AttendanceSessionsService] Restored session points after unarchiving", { id, restoredCount });
    } catch (err) {
      logger.error("[AttendanceSessionsService] Error restoring points during session restore", err);
    }

    return updatedSession;
  }

  public async lockSession(id: UUID, actorId: UUID): Promise<AttendanceSessionSelect> {
    return this.archiveSession(id, actorId);
  }

  public async getActiveSessions(pagination: PaginationQuery): Promise<PaginatedResult<AttendanceSessionSelect>> {
    return this.sessionsRepo.findAll(pagination, { includeArchived: false });
  }

  public async getArchivedSessions(pagination: PaginationQuery): Promise<PaginatedResult<AttendanceSessionSelect>> {
    return this.sessionsRepo.findAll(pagination, { onlyArchived: true });
  }
}
