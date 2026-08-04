/**
 * Attendance Domain - Attendance Records Service Implementation
 * Production Polish: Idempotent Attendance Synchronization & One-time Repair Integration
 */

import { AttendanceRecordsRepository } from "@/repositories/attendance/attendance_records.repository";
import { AttendanceSessionsRepository } from "@/repositories/attendance/attendance_sessions.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { AttendanceRecordSelect } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { ConflictError, NotFoundError, BadRequestError } from "@/core/errors";
import { logger } from "@/core/logger";

import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { SemesterContextService } from "@/services/academic/semester-context.service";
import { PointsLedgerRepository } from "@/repositories/points/points_ledger.repository";
import { AttendanceRepairService } from "./attendance_repair.service";

export class AttendanceRecordsService {
  constructor(
    private readonly recordsRepo: AttendanceRecordsRepository,
    private readonly sessionsRepo: AttendanceSessionsRepository,
    private readonly membersRepo: MembersRepository,
    private readonly membershipsRepo: MembershipsRepository = new MembershipsRepository(),
    private readonly semesterContextService: SemesterContextService = new SemesterContextService(),
    private readonly pointsLedgerRepo: PointsLedgerRepository = new PointsLedgerRepository()
  ) {}

  public async recordAttendance(
    data: { memberId: UUID; sessionId: UUID; method?: string; remarks?: string },
    actorId: UUID
  ): Promise<AttendanceRecordSelect> {
    logger.info("[AttendanceRecordsService] Executing attendance scan check-in", {
      memberId: data.memberId,
      sessionId: data.sessionId,
      actorId,
    });

    const activeSemester = await this.semesterContextService.getActiveSemester();
    if (activeSemester) {
      const activeMem = await this.membershipsRepo.findActiveMembership(data.memberId);
      if (!activeMem || activeMem.semesterId !== activeSemester.id || activeMem.status !== "active") {
        throw new ConflictError(
          "Member is not renewed for the active semester. Only active semester members can participate in attendance.",
          "MEMBER_NOT_RENEWED"
        );
      }
    }

    const [member, session] = await Promise.all([
      this.membersRepo.findById(data.memberId),
      this.sessionsRepo.findById(data.sessionId),
    ]);

    if (!member) {
      throw new NotFoundError(`Member with ID ${data.memberId} not found`, "MEMBER_NOT_FOUND");
    }

    if (!session) {
      throw new NotFoundError(`Session with ID ${data.sessionId} not found`, "SESSION_CLOSED");
    }

    if (session.status === "archived") {
      throw new BadRequestError(
        `Session is archived. Check-ins allowed only for active or open sessions`,
        "SESSION_CLOSED"
      );
    }

    const existingRecord = await this.recordsRepo.findByMemberAndSession(
      data.memberId,
      data.sessionId
    );

    if (existingRecord) {
      throw new ConflictError(
        "Attendance has already been recorded for this member in the specified session",
        "ATTENDANCE_ALREADY_MARKED"
      );
    }

    // Evaluate Late threshold
    const currentTime = new Date();
    const isLate = false;
    const points = isLate ? session.latePoints : session.attendancePoints;

    const record = await this.recordsRepo.create({
      memberId: data.memberId,
      sessionId: data.sessionId,
      scanTime: currentTime,
      points,
      late: isLate,
      volunteerUser: actorId,
      method: data.method || "qr",
      remarks: data.remarks,
    });

    // Check if points_ledger entry already exists for this (sessionId, memberId)
    const existingLedger = await this.pointsLedgerRepo.findByMemberAndReference(data.memberId, record.id);
    if (existingLedger.length === 0) {
      try {
        await this.pointsLedgerRepo.create({
          memberId: data.memberId,
          category: "attendance",
          referenceType: "attendance_records",
          referenceId: record.id,
          semesterId: session.semesterId || activeSemester?.id,
          points: points || 10,
          createdBy: actorId || "00000000-0000-0000-0000-000000000001",
          remarks: `Attendance points for session "${session.title}"`,
        });
      } catch (err) {
        logger.error("[AttendanceRecordsService] Failed to create points_ledger entry", err);
      }
    }

    return record;
  }

  public async getSessionRecords(
    sessionId: UUID,
    query: PaginationQuery = {}
  ): Promise<PaginatedResult<AttendanceRecordSelect>> {
    return this.recordsRepo.getBySessionId(sessionId, query);
  }

  public async getMemberRecords(
    memberId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<AttendanceRecordSelect>> {
    return this.recordsRepo.getByMemberId(memberId, query);
  }

  public async getAllRecords(
    query: PaginationQuery
  ): Promise<PaginatedResult<AttendanceRecordSelect>> {
    return this.recordsRepo.getAll(query);
  }

  /**
   * Idempotent Delta Attendance Synchronization
   * Compares current attendance state with target state and applies ONLY the delta (+added, -removed, =unchanged).
   * Saving the same session multiple times without modifications results in ZERO additional points being awarded.
   */
  public async bulkRecordAttendance(
    sessionId: UUID,
    targetMemberIds: UUID[],
    actorId: UUID
  ): Promise<{ recordedCount: number; removedCount: number }> {
    logger.info("[AttendanceRecordsService] Synchronizing attendance (idempotent delta execution)", {
      sessionId,
      targetCount: targetMemberIds.length,
      actorId,
    });

    const session = await this.sessionsRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError(`Session with ID ${sessionId} not found`, "SESSION_NOT_FOUND");
    }

    if (session.status === "archived") {
      throw new BadRequestError("Cannot record attendance for archived sessions", "SESSION_ARCHIVED");
    }

    const activeSemester = await this.semesterContextService.getActiveSemester();

    // Fetch existing attendance records for this session
    const existingRecordsRes = await this.recordsRepo.getBySessionId(sessionId, { limit: 1000 });
    const existingRecords = existingRecordsRes.items || [];

    const existingMap = new Map<string, AttendanceRecordSelect>();
    existingRecords.forEach((r) => existingMap.set(r.memberId, r));

    const targetSet = new Set(targetMemberIds);

    const toAddMemberIds = targetMemberIds.filter((mId) => !existingMap.has(mId));
    const toRemoveMemberIds = Array.from(existingMap.keys()).filter((mId) => !targetSet.has(mId));
    const unchangedMemberIds = targetMemberIds.filter((mId) => existingMap.has(mId));

    logger.info(`[AttendanceRecordsService] Attendance sync delta: +${toAddMemberIds.length} added, -${toRemoveMemberIds.length} removed, =${unchangedMemberIds.length} unchanged`);

    const currentTime = new Date();
    let recordedCount = 0;
    let removedCount = 0;

    // 1. Process Newly Added Members (+Delta)
    for (const memberId of toAddMemberIds) {
      const record = await this.recordsRepo.create({
        memberId,
        sessionId,
        scanTime: currentTime,
        points: session.attendancePoints || 10,
        late: false,
        volunteerUser: actorId,
        method: "checklist",
        remarks: `Recorded via Attendance Screen for "${session.title}"`,
      });
      recordedCount++;

      // Check if points ledger entry already exists for this (sessionId/record.id, memberId)
      const existingLedger = await this.pointsLedgerRepo.findByMemberAndReference(memberId, record.id);
      if (existingLedger.length === 0) {
        try {
          await this.pointsLedgerRepo.create({
            memberId,
            category: "attendance",
            referenceType: "attendance_records",
            referenceId: record.id,
            semesterId: session.semesterId || activeSemester?.id,
            points: session.attendancePoints || 10,
            createdBy: actorId || "00000000-0000-0000-0000-000000000001",
            remarks: `Attendance points for session "${session.title}"`,
          });
        } catch (err) {
          logger.error("[AttendanceRecordsService] Points ledger create error for new check-in", err);
        }
      }
    }

    // 2. Process Removed Members (-Delta)
    for (const memberId of toRemoveMemberIds) {
      const rec = existingMap.get(memberId);
      if (rec) {
        // Delete attendance_record
        await this.recordsRepo.delete(rec.id);
        removedCount++;

        // Delete points_ledger entry associated with rec.id or sessionId
        const ledgerEntriesByRec = await this.pointsLedgerRepo.findByMemberAndReference(memberId, rec.id);
        const ledgerEntriesBySess = await this.pointsLedgerRepo.findByMemberAndReference(memberId, sessionId);
        const idsToDelete = Array.from(new Set([...ledgerEntriesByRec.map((l) => l.id), ...ledgerEntriesBySess.map((l) => l.id)]));
        if (idsToDelete.length > 0) {
          await this.pointsLedgerRepo.deleteByIds(idsToDelete);
        }
      }
    }

    // 3. Unchanged Members (=Delta) -> ZERO OPERATIONS!
    // No points ledger entries created, no score modifications.

    // 4. Run background repair routine to clean up pre-existing duplicate awards
    try {
      const repairService = new AttendanceRepairService();
      await repairService.repairDuplicateAttendancePoints();
    } catch (err) {
      logger.warn("[AttendanceRecordsService] Repair routine warning", { error: String(err) });
    }

    return { recordedCount, removedCount };
  }
}
