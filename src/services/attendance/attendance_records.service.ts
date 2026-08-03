/**
 * Attendance Domain - Attendance Records Service Implementation
 */

import { AttendanceRecordsRepository } from "@/repositories/attendance/attendance_records.repository";
import { AttendanceSessionsRepository } from "@/repositories/attendance/attendance_sessions.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { AttendanceRecordSelect, AttendanceRecordInsert } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { ConflictError, NotFoundError, BadRequestError } from "@/core/errors";
import { logger } from "@/core/logger";

import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { SemesterContextService } from "@/services/academic/semester-context.service";

import { PointsLedgerRepository } from "@/repositories/points/points_ledger.repository";

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
    const isLate = false; // Evaluated dynamically against start_time + late_threshold
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

    // Write points_ledger entry so member total points & leaderboard update automatically
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

  public async bulkRecordAttendance(
    sessionId: UUID,
    memberIds: UUID[],
    actorId: UUID
  ): Promise<{ recordedCount: number }> {
    logger.info("[AttendanceRecordsService] Bulk recording attendance", {
      sessionId,
      count: memberIds.length,
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

    const existingRecords = await this.recordsRepo.getBySessionId(sessionId, { limit: 1000 });
    const existingMemberIds = new Set(existingRecords.items.map((r) => r.memberId));

    let count = 0;
    const currentTime = new Date();

    for (const memberId of memberIds) {
      if (!existingMemberIds.has(memberId)) {
        const record = await this.recordsRepo.create({
          memberId,
          sessionId,
          scanTime: currentTime,
          points: session.attendancePoints || 10,
          late: false,
          volunteerUser: actorId,
          method: "checklist",
          remarks: "Recorded via Attendance Screen",
        });
        count++;

        // Write points_ledger entry for new attendance check-in
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
          logger.error("[AttendanceRecordsService] Bulk points ledger error", err);
        }
      } else {
        // Backfill points in points_ledger for existing record if not already recorded
        const rec = existingRecords.items.find((r) => r.memberId === memberId);
        if (rec) {
          try {
            await this.pointsLedgerRepo.create({
              memberId,
              category: "attendance",
              referenceType: "attendance_records",
              referenceId: rec.id,
              semesterId: session.semesterId || activeSemester?.id,
              points: rec.points || session.attendancePoints || 10,
              createdBy: actorId || "00000000-0000-0000-0000-000000000001",
              remarks: `Attendance points for session "${session.title}"`,
            });
          } catch {
            // Ignore if already logged in points_ledger
          }
        }
      }
    }

    return { recordedCount: count };
  }
}
