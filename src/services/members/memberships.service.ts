/**
 * Members Domain - Memberships Service Implementation
 */

import { BaseService } from "@/core/service/base-service";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { MembershipSelect, MembershipInsert } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { ConflictError, NotFoundError } from "@/core/errors";
import { logger } from "@/core/logger";

export class MembershipsService extends BaseService<
  MembershipSelect,
  MembershipInsert,
  Partial<MembershipInsert>
> {
  constructor(
    private readonly membershipsRepo: MembershipsRepository,
    private readonly membersRepo?: MembersRepository
  ) {
    super(membershipsRepo, undefined, "MembershipsService");
  }

  public async createMembership(
    data: any,
    actorId: UUID
  ): Promise<MembershipSelect> {
    logger.info("[MembershipsService] Executing create membership workflow", {
      memberId: data.memberId,
      academicYearId: data.academicYearId,
      semesterId: data.semesterId,
      actorId,
    });

    if (this.membersRepo) {
      const member = await this.membersRepo.findById(data.memberId);
      if (!member) {
        throw new NotFoundError(
          `Cannot create membership. Member ID ${data.memberId} not found`,
          "MEMBER_NOT_FOUND"
        );
      }
    }

    const activeMembership = await this.membershipsRepo.findActiveMembership(
      data.memberId
    );
    if (
      activeMembership &&
      activeMembership.academicYearId === data.academicYearId &&
      activeMembership.semesterId === data.semesterId
    ) {
      logger.warn("[MembershipsService] Member already active for term", {
        memberId: data.memberId,
        semesterId: data.semesterId,
      });
      throw new ConflictError(
        "Member already holds an active membership for the specified semester",
        "MEMBERSHIP_ALREADY_EXISTS"
      );
    }

    return this.membershipsRepo.create(data, actorId);
  }

  public async activateMembership(
    id: UUID,
    actorId: UUID
  ): Promise<MembershipSelect> {
    logger.info("[MembershipsService] Activating membership", { id, actorId });
    await this.getById(id);

    return this.membershipsRepo.update(
      id,
      { status: "active" },
      actorId
    );
  }

  public async suspendMembership(
    id: UUID,
    actorId: UUID
  ): Promise<MembershipSelect> {
    logger.info("[MembershipsService] Suspending membership", { id, actorId });
    await this.getById(id);

    return this.membershipsRepo.update(
      id,
      { status: "suspended" },
      actorId
    );
  }

  public async closeMembership(
    id: UUID,
    actorId: UUID
  ): Promise<MembershipSelect> {
    logger.info("[MembershipsService] Closing membership", { id, actorId });
    await this.getById(id);

    const currentDate = new Date();
    return this.membershipsRepo.update(
      id,
      {
        status: "inactive",
        exitDate: currentDate,
      },
      actorId
    );
  }

  public async getActiveMembership(
    memberId: UUID
  ): Promise<MembershipSelect | null> {
    logger.debug("[MembershipsService] Getting active membership for member", {
      memberId,
    });
    return this.membershipsRepo.findActiveMembership(memberId);
  }

  public async getMembershipHistory(
    memberId: UUID
  ): Promise<MembershipSelect[]> {
    logger.debug("[MembershipsService] Getting membership history for member", {
      memberId,
    });
    return this.membershipsRepo.getMembershipHistory(memberId);
  }

  public async getMembershipsByAcademicYear(
    academicYearId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<MembershipSelect>> {
    logger.debug("[MembershipsService] Getting memberships by academic year", {
      academicYearId,
      query,
    });
    return this.membershipsRepo.getByAcademicYear(academicYearId, query);
  }

  public async getMembershipsBySemester(
    semesterId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<MembershipSelect>> {
    logger.debug("[MembershipsService] Getting memberships by semester", {
      semesterId,
      query,
    });
    return this.membershipsRepo.getBySemester(semesterId, query);
  }
}
