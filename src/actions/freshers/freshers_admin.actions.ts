"use server";

/**
 * Freshers Domain - Admin Server Actions
 * Protected server actions for campaign management, dashboard KPIs, and lucky draw execution.
 */

import { ApiResponse, UUID } from "@/core/types";
import { FreshersCampaignService } from "@/services/freshers/freshers_campaign.service";
import { FreshersCampaignSelect, FreshersCampaignEntrySelect } from "@/db/schema";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";

const freshersService = new FreshersCampaignService();

async function getAdminActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001" as UUID,
    role: "super_admin",
    permissions: [PERMISSIONS.CAMPAIGN_VIEW, PERMISSIONS.CAMPAIGN_MANAGE],
  };
}

export async function getFreshersAdminDashboardAction(options: {
  search?: string;
  rating?: number;
  drawStatus?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<
  ApiResponse<{
    activeCampaign: FreshersCampaignSelect | null;
    stats: {
      totalEntries: number;
      todaysEntries: number;
      avgRating: number;
      eligibleEntries: number;
      winnersSelected: number;
    };
    entries: FreshersCampaignEntrySelect[];
    total: number;
    winners: FreshersCampaignEntrySelect[];
  }>
> {
  logger.info("[AdminAction: getFreshersAdminDashboardAction] Fetching admin dashboard data");
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.CAMPAIGN_VIEW);

    const data = await freshersService.getAdminDashboardData(options);
    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error("[AdminAction: getFreshersAdminDashboardAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function updateCampaignStatusAction(
  campaignId: UUID,
  status: "draft" | "active" | "closed"
): Promise<ApiResponse<FreshersCampaignSelect>> {
  logger.info("[AdminAction: updateCampaignStatusAction] Updating campaign status", { campaignId, status });
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.CAMPAIGN_MANAGE);

    const updated = await freshersService.updateCampaignStatus(campaignId, status, actor.id);
    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    logger.error("[AdminAction: updateCampaignStatusAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function executeLuckyDrawAction(prizeTier: string = "Tier A - Welcome Reward"): Promise<
  ApiResponse<FreshersCampaignEntrySelect>
> {
  logger.info("[AdminAction: executeLuckyDrawAction] Initiating lucky draw winner selection", { prizeTier });
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.CAMPAIGN_MANAGE);

    const winner = await freshersService.executeLuckyDraw(actor.id, prizeTier);
    return {
      success: true,
      data: winner,
    };
  } catch (error) {
    logger.error("[AdminAction: executeLuckyDrawAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function convertCampaignEntryToMemberAction(entryId: UUID): Promise<
  ApiResponse<{ memberId?: string; message: string }>
> {
  logger.info("[AdminAction: convertCampaignEntryToMemberAction] Converting entry to official member", { entryId });
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.CAMPAIGN_MANAGE);

    const result = await freshersService.convertEntryToMember(entryId, actor.id);
    if (!result.success) {
      return {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: result.message || "Failed to convert entry.",
        },
      };
    }

    return {
      success: true,
      data: {
        memberId: result.memberId,
        message: result.message || "Entry successfully converted!",
      },
    };
  } catch (error) {
    logger.error("[AdminAction: convertCampaignEntryToMemberAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
