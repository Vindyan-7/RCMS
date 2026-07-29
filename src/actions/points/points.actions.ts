"use server";

/**
 * Points Domain - Server Actions Implementation
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { PointsLedgerSelect, PointRuleSelect } from "@/db/schema";
import { PointsLedgerRepository, PointRulesRepository, LeaderboardItem } from "@/repositories/points";
import { MembersRepository } from "@/repositories/members";
import { PointsService } from "@/services/points";
import { PointsValidator } from "@/validation/points";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";

const ledgerRepo = new PointsLedgerRepository();
const rulesRepo = new PointRulesRepository();
const membersRepo = new MembersRepository();
const pointsService = new PointsService(ledgerRepo, rulesRepo, membersRepo);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.FINANCE_VIEW, PERMISSIONS.MEMBERS_VIEW],
  };
}

export async function awardPointsAction(
  rawInput: unknown
): Promise<ApiResponse<PointsLedgerSelect>> {
  logger.info("[Action: awardPointsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_MANAGE);

    const validatedInput = await PointsValidator.validateAward(rawInput);
    const entry = await pointsService.awardPoints(
      {
        memberId: validatedInput.memberId,
        category: validatedInput.category,
        points: validatedInput.points,
        referenceType: validatedInput.referenceType || undefined,
        referenceId: validatedInput.referenceId || undefined,
        remarks: validatedInput.remarks || undefined,
      },
      actor.id
    );

    logger.info("[Action: awardPointsAction] Action completed successfully", { id: entry.id });

    return {
      success: true,
      data: entry,
    };
  } catch (error) {
    logger.error("[Action: awardPointsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function deductPointsAction(
  rawInput: unknown
): Promise<ApiResponse<PointsLedgerSelect>> {
  logger.info("[Action: deductPointsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_MANAGE);

    const validatedInput = await PointsValidator.validateDeduct(rawInput);
    const entry = await pointsService.deductPoints(
      {
        memberId: validatedInput.memberId,
        category: validatedInput.category || "penalty",
        points: validatedInput.points,
        remarks: validatedInput.remarks || undefined,
      },
      actor.id
    );

    logger.info("[Action: deductPointsAction] Action completed successfully", { id: entry.id });

    return {
      success: true,
      data: entry,
    };
  } catch (error) {
    logger.error("[Action: deductPointsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function rollbackTransactionAction(
  rawInput: unknown
): Promise<ApiResponse<PointsLedgerSelect>> {
  logger.info("[Action: rollbackTransactionAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_MANAGE);

    const validatedInput = await PointsValidator.validateRollback(rawInput);
    const entry = await pointsService.rollbackTransaction(
      validatedInput.transactionId,
      validatedInput.reason,
      actor.id
    );

    return {
      success: true,
      data: entry,
    };
  } catch (error) {
    logger.error("[Action: rollbackTransactionAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getMemberScoreAction(
  memberId: string
): Promise<ApiResponse<{ memberId: string; totalPoints: number }>> {
  logger.debug("[Action: getMemberScoreAction] Initiating action execution", { memberId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const score = await pointsService.getMemberScore(memberId);

    return {
      success: true,
      data: score,
    };
  } catch (error) {
    logger.error("[Action: getMemberScoreAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getLeaderboardAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<LeaderboardItem>>> {
  logger.debug("[Action: getLeaderboardAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const leaderboard = await pointsService.getLeaderboard(pagination || {});

    return {
      success: true,
      data: leaderboard,
    };
  } catch (error) {
    logger.error("[Action: getLeaderboardAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function createPointRuleAction(
  rawInput: unknown
): Promise<ApiResponse<PointRuleSelect>> {
  logger.info("[Action: createPointRuleAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_MANAGE);

    const validatedInput = await PointsValidator.validateRule(rawInput);
    const rule = await pointsService.createPointRule(
      {
        trigger: validatedInput.trigger,
        category: validatedInput.category,
        points: validatedInput.points,
        enabled: validatedInput.enabled ?? true,
        priority: validatedInput.priority ?? 1,
        description: validatedInput.description || undefined,
      },
      actor.id
    );

    return {
      success: true,
      data: rule,
    };
  } catch (error) {
    logger.error("[Action: createPointRuleAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
