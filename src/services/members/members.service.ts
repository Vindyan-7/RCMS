/**
 * Members Domain - Members Service Implementation
 */

import { BaseService } from "@/core/service/base-service";
import { MembersRepository } from "@/repositories/members/members.repository";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { MemberSelect, MemberInsert, MembershipSelect } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { ConflictError, NotFoundError } from "@/core/errors";
import { logger } from "@/core/logger";

export interface MemberProfileResponse {
  member: MemberSelect;
  activeMembership: MembershipSelect | null;
}

export class MembersService extends BaseService<
  MemberSelect,
  MemberInsert,
  Partial<MemberInsert>
> {
  constructor(
    private readonly membersRepo: MembersRepository,
    private readonly membershipsRepo?: MembershipsRepository
  ) {
    super(membersRepo, undefined, "MembersService");
  }

  public async registerMember(
    data: any,
    actorId: UUID
  ): Promise<MemberSelect> {
    logger.info("[MembersService] Executing member registration workflow", {
      rollNumber: data.rollNumber,
      email: data.email,
      actorId,
    });

    // Uniqueness validation checks
    const [existingRoll, existingEmail] = await Promise.all([
      this.membersRepo.findByRollNumber(data.rollNumber),
      this.membersRepo.findByEmail(data.email),
    ]);

    if (existingRoll) {
      logger.warn("[MembersService] Roll number already registered", {
        rollNumber: data.rollNumber,
      });
      throw new ConflictError(
        `Roll number ${data.rollNumber} is already registered to another member`,
        "MEMBER_ALREADY_EXISTS"
      );
    }

    if (existingEmail) {
      logger.warn("[MembersService] Email address already registered", {
        email: data.email,
      });
      throw new ConflictError(
        `Email address ${data.email} is already registered to another member`,
        "MEMBER_ALREADY_EXISTS"
      );
    }

    const createdMember = await this.membersRepo.create(data, actorId);
    logger.info("[MembersService] Member registered successfully", {
      memberId: createdMember.id,
      externalId: createdMember.memberId,
    });

    return createdMember;
  }

  public async updateMember(
    id: UUID,
    data: Partial<MemberInsert>,
    actorId: UUID
  ): Promise<MemberSelect> {
    logger.info("[MembersService] Executing member update workflow", {
      id,
      actorId,
    });

    const currentMember = await this.getById(id);

    const updatePayload = { ...data };
    if (updatePayload.branch) {
      const { normalizeBranch } = require("@/constants/branches");
      updatePayload.branch = normalizeBranch(updatePayload.branch);
    }

    // Uniqueness check if updating roll number or email
    if (updatePayload.rollNumber && updatePayload.rollNumber !== currentMember.rollNumber) {
      const existingRoll = await this.membersRepo.findByRollNumber(updatePayload.rollNumber);
      if (existingRoll && existingRoll.id !== id) {
        throw new ConflictError(
          `Roll number ${updatePayload.rollNumber} is already in use`,
          "MEMBER_ALREADY_EXISTS"
        );
      }
    }

    if (updatePayload.email && updatePayload.email !== currentMember.email) {
      const existingEmail = await this.membersRepo.findByEmail(updatePayload.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictError(
          `Email address ${updatePayload.email} is already in use`,
          "MEMBER_ALREADY_EXISTS"
        );
      }
    }

    return this.membersRepo.update(id, updatePayload, actorId);
  }

  public async getMemberProfile(id: UUID): Promise<MemberProfileResponse> {
    logger.debug("[MembersService] Retrieving full member profile", { id });
    const member = await this.getById(id);

    let activeMembership: MembershipSelect | null = null;
    if (this.membershipsRepo) {
      activeMembership = await this.membershipsRepo.findActiveMembership(id);
    }

    return {
      member,
      activeMembership,
    };
  }

  public async searchMembers(
    query: string,
    pagination: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<MemberSelect>> {
    logger.debug("[MembersService] Performing member search", { query, pagination });
    return this.membersRepo.findAll(
      {
        ...pagination,
        search: query,
      },
      options
    );
  }

  public async archiveMember(id: UUID, actorId: UUID): Promise<boolean> {
    logger.info("[MembersService] Archiving member", { id, actorId });
    await this.getById(id);
    return this.membersRepo.delete(id, actorId);
  }

  public async restoreMember(id: UUID, actorId: UUID): Promise<boolean> {
    logger.info("[MembersService] Restoring member", { id, actorId });
    const member = await this.membersRepo.findById(id, { includeDeleted: true });
    if (!member) {
      throw new NotFoundError(`Member with ID ${id} not found`);
    }
    return this.membersRepo.restore(id, actorId);
  }
}
