/**
 * Academic Domain - Semesters Service Implementation
 */

import { SemestersRepository } from "@/repositories/members/semesters.repository";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { SemesterSelect, SemesterInsert } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { ConflictError, NotFoundError } from "@/core/errors";
import { logger } from "@/core/logger";

export class SemestersService {
  constructor(
    private readonly semestersRepo: SemestersRepository,
    private readonly membershipsRepo?: MembershipsRepository
  ) {}

  public async createSemester(data: any, actorId: UUID): Promise<SemesterSelect> {
    logger.info("[SemestersService] Creating new semester", { name: data.name, actorId });
    return this.semestersRepo.create(data, actorId);
  }

  public async updateSemester(
    id: UUID,
    data: Partial<SemesterInsert>,
    actorId: UUID
  ): Promise<SemesterSelect> {
    logger.info("[SemestersService] Updating semester", { id, actorId });
    const existing = await this.semestersRepo.findById(id);
    if (!existing) throw new NotFoundError(`Semester ${id} not found`, "SEMESTER_NOT_FOUND");
    return this.semestersRepo.update(id, data, actorId);
  }

  public async activateSemester(id: UUID, actorId: UUID): Promise<SemesterSelect> {
    logger.info("[SemestersService] Activating semester", { id, actorId });
    const existing = await this.semestersRepo.findById(id);
    if (!existing) throw new NotFoundError(`Semester ${id} not found`, "SEMESTER_NOT_FOUND");

    // Only one semester may be active at a time
    const currentActive = await this.semestersRepo.findActive();
    if (currentActive && currentActive.id !== id) {
      throw new ConflictError(
        `Semester "${currentActive.name}" is already active. Complete it before activating another.`,
        "SEMESTER_ALREADY_ACTIVE"
      );
    }

    return this.semestersRepo.update(id, { status: "active" }, actorId);
  }

  public async completeSemester(id: UUID, actorId: UUID): Promise<SemesterSelect> {
    logger.info("[SemestersService] Completing semester", { id, actorId });
    const existing = await this.semestersRepo.findById(id);
    if (!existing) throw new NotFoundError(`Semester ${id} not found`, "SEMESTER_NOT_FOUND");

    // Close all active memberships for this semester
    if (this.membershipsRepo) {
      const mems = await this.membershipsRepo.getBySemester(id, { limit: 1000 });
      for (const m of mems.items) {
        if (m.status === "active") {
          await this.membershipsRepo.update(
            m.id,
            { status: "past", exitDate: new Date() },
            actorId
          );
        }
      }
    }

    return this.semestersRepo.update(id, { status: "completed" }, actorId);
  }

  public async getActiveSemester(): Promise<SemesterSelect | null> {
    return this.semestersRepo.findActive();
  }

  public async getSemesterById(id: UUID): Promise<SemesterSelect | null> {
    return this.semestersRepo.findById(id);
  }

  public async getAllSemesters(
    query: PaginationQuery
  ): Promise<PaginatedResult<SemesterSelect>> {
    return this.semestersRepo.findAll(query);
  }

  public async deleteSemester(id: UUID, actorId: UUID): Promise<boolean> {
    logger.info("[SemestersService] Deleting semester", { id, actorId });
    return this.semestersRepo.delete(id, actorId);
  }
}
