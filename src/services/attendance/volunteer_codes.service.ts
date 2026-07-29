/**
 * Attendance Domain - Volunteer Codes Service Implementation
 */

import { VolunteerCodesRepository } from "@/repositories/attendance/volunteer_codes.repository";
import { AttendanceSessionsRepository } from "@/repositories/attendance/attendance_sessions.repository";
import { VolunteerCodeSelect } from "@/db/schema";
import { UUID } from "@/core/types";
import { NotFoundError, BadRequestError, UnauthorizedError } from "@/core/errors";
import { logger } from "@/core/logger";

export class VolunteerCodesService {
  constructor(
    private readonly codesRepo: VolunteerCodesRepository,
    private readonly sessionsRepo: AttendanceSessionsRepository
  ) {}

  public async generateCode(
    sessionId: UUID,
    expirationHours: number = 4
  ): Promise<VolunteerCodeSelect> {
    logger.info("[VolunteerCodesService] Generating volunteer scanner PIN", { sessionId });

    const session = await this.sessionsRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError(`Session with ID ${sessionId} not found`);
    }

    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    return this.codesRepo.create({
      sessionId,
      code: randomPin,
      status: "unused",
      expiresAt,
    });
  }

  public async validateCode(code: string, actorId: UUID): Promise<VolunteerCodeSelect> {
    logger.info("[VolunteerCodesService] Validating volunteer scanner PIN", { code, actorId });

    const codeRecord = await this.codesRepo.findByCode(code);
    if (!codeRecord) {
      throw new UnauthorizedError("Invalid volunteer scanner passcode PIN");
    }

    if (codeRecord.status === "expired" || codeRecord.status === "revoked") {
      throw new UnauthorizedError(`Volunteer code is ${codeRecord.status}`);
    }

    if (new Date() > new Date(codeRecord.expiresAt)) {
      await this.codesRepo.updateStatus(codeRecord.id, "expired");
      throw new UnauthorizedError("Volunteer scanner code has expired");
    }

    if (codeRecord.status === "unused") {
      return this.codesRepo.updateStatus(codeRecord.id, "active", actorId);
    }

    return codeRecord;
  }
}
