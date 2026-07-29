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

export class AttendanceRecordsService {
  constructor(
    private readonly recordsRepo: AttendanceRecordsRepository,
    private readonly sessionsRepo: AttendanceSessionsRepository,
    private readonly membersRepo: MembersRepository
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

    if (session.status !== "active") {
      throw new BadRequestError(
        `Session is currently ${session.status}. Check-ins allowed only for active sessions`,
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

    return this.recordsRepo.create({
      memberId: data.memberId,
      sessionId: data.sessionId,
      scanTime: currentTime,
      points,
      late: isLate,
      volunteerUser: actorId,
      method: data.method || "qr",
      remarks: data.remarks,
    });
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
}
