/**
 * Points Domain - Points Service Implementation (Scoring Engine)
 */

import { PointsLedgerRepository, LeaderboardItem } from "@/repositories/points/points_ledger.repository";
import { PointRulesRepository } from "@/repositories/points/point_rules.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { PointsLedgerSelect, PointsLedgerInsert, PointRuleSelect, PointRuleInsert } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { SemesterContextService } from "@/services/academic/semester-context.service";
import { ConflictError, NotFoundError, BadRequestError } from "@/core/errors";
import { logger } from "@/core/logger";

export class PointsService {
  constructor(
    private readonly ledgerRepo: PointsLedgerRepository,
    private readonly rulesRepo: PointRulesRepository,
    private readonly membersRepo?: MembersRepository,
    private readonly membershipsRepo: MembershipsRepository = new MembershipsRepository(),
    private readonly semesterContextService: SemesterContextService = new SemesterContextService()
  ) {}

  public async awardPoints(
    data: {
      memberId: UUID;
      category: string;
      points: number;
      referenceType?: string;
      referenceId?: UUID;
      remarks?: string;
    },
    actorId: UUID
  ): Promise<PointsLedgerSelect> {
    logger.info("[PointsService] Awarding points to member", {
      memberId: data.memberId,
      points: data.points,
      category: data.category,
      actorId,
    });

    const activeSemester = await this.semesterContextService.getActiveSemester();
    if (activeSemester) {
      const activeMem = await this.membershipsRepo.findActiveMembership(data.memberId);
      if (!activeMem || activeMem.semesterId !== activeSemester.id || activeMem.status !== "active") {
        throw new ConflictError(
          "Member is not renewed for the active semester. Only active semester members can receive points.",
          "MEMBER_NOT_RENEWED"
        );
      }
    }

    if (this.membersRepo) {
      const member = await this.membersRepo.findById(data.memberId);
      if (!member) {
        throw new NotFoundError(`Member ${data.memberId} not found`, "MEMBER_NOT_FOUND");
      }
    }

    if (data.points <= 0) {
      throw new BadRequestError("Award points value must be greater than zero");
    }

    return this.ledgerRepo.create({
      memberId: data.memberId,
      category: data.category,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      semesterId: activeSemester?.id,
      points: data.points,
      createdBy: actorId,
      remarks: data.remarks,
    });
  }

  public async deductPoints(
    data: {
      memberId: UUID;
      category: string;
      points: number;
      remarks?: string;
    },
    actorId: UUID
  ): Promise<PointsLedgerSelect> {
    logger.info("[PointsService] Deducting points from member", {
      memberId: data.memberId,
      points: data.points,
      actorId,
    });

    if (data.points <= 0) {
      throw new BadRequestError("Deduction points value must be greater than zero");
    }

    const activeSemester = await this.semesterContextService.getActiveSemester();

    // Ledger stores deductions as negative integer values
    return this.ledgerRepo.create({
      memberId: data.memberId,
      category: data.category || "penalty",
      referenceType: "manual",
      semesterId: activeSemester?.id,
      points: -Math.abs(data.points),
      createdBy: actorId,
      remarks: data.remarks,
    });
  }

  public async rollbackTransaction(
    transactionId: UUID,
    reason: string,
    actorId: UUID
  ): Promise<PointsLedgerSelect> {
    logger.info("[PointsService] Rolling back points transaction", { transactionId, actorId });

    const originalRecord = await this.ledgerRepo.findById(transactionId);
    if (!originalRecord) {
      throw new NotFoundError(`Ledger transaction ${transactionId} not found`);
    }

    // Insert balancing record with inverted point value
    return this.ledgerRepo.create({
      memberId: originalRecord.memberId,
      category: "rollback",
      referenceType: "points_ledger",
      referenceId: originalRecord.id,
      semesterId: originalRecord.semesterId,
      points: -originalRecord.points,
      createdBy: actorId,
      remarks: `Rollback of transaction ${transactionId}: ${reason}`,
    });
  }

  public async evaluateRuleAndAward(
    trigger: string,
    memberId: UUID,
    referenceType?: string,
    referenceId?: UUID,
    actorId: UUID = "00000000-0000-0000-0000-000000000001"
  ): Promise<PointsLedgerSelect | null> {
    logger.debug("[PointsService] Evaluating scoring rules for trigger", { trigger, memberId });

    const activeRules = await this.rulesRepo.findActiveRulesByTrigger(trigger);
    if (activeRules.length === 0) {
      return null;
    }

    // Select highest priority rule
    const topRule = activeRules.sort((a, b) => b.priority - a.priority)[0];

    return this.awardPoints(
      {
        memberId,
        category: topRule.category,
        points: topRule.points,
        referenceType,
        referenceId,
        remarks: `Auto-awarded by rule ${topRule.id}: ${topRule.description || trigger}`,
      },
      actorId
    );
  }

  public async getMemberScore(memberId: UUID): Promise<{ memberId: UUID; totalPoints: number }> {
    const totalPoints = await this.ledgerRepo.calculateMemberTotalPoints(memberId);
    return {
      memberId,
      totalPoints,
    };
  }

  public async getLeaderboard(pagination: PaginationQuery, semesterId?: string): Promise<PaginatedResult<LeaderboardItem>> {
    const targetSemId = semesterId !== undefined ? semesterId : ((await this.semesterContextService.getActiveSemesterId()) || undefined);
    return this.ledgerRepo.getLeaderboard(pagination, targetSemId);
  }

  public async createPointRule(data: any, actorId: UUID): Promise<PointRuleSelect> {
    return this.rulesRepo.create(data, actorId);
  }
}
