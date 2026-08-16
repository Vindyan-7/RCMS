"use server";

/**
 * Freshers Domain - Public Server Actions
 * Exposes safe public campaign queries and entry submission.
 */

import { ApiResponse } from "@/core/types";
import { FreshersCampaignService, PublicEntryResult } from "@/services/freshers/freshers_campaign.service";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";

const freshersService = new FreshersCampaignService();

export async function getActiveCampaignPublicAction(): Promise<
  ApiResponse<{
    id: string;
    campaignKey: string;
    title: string;
    description: string;
    status: string;
  } | null>
> {
  logger.info("[PublicAction: getActiveCampaignPublicAction] Fetching public campaign details");
  try {
    const campaign = await freshersService.getActiveCampaignPublic();
    return {
      success: true,
      data: campaign,
    };
  } catch (error) {
    logger.error("[PublicAction: getActiveCampaignPublicAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function submitFreshersCampaignEntryAction(rawInput: {
  fullName: string;
  mobileNumber: string;
  stallRating: number;
  feedback?: string;
}): Promise<ApiResponse<PublicEntryResult>> {
  logger.info("[PublicAction: submitFreshersCampaignEntryAction] Submitting freshers campaign entry");
  try {
    const result = await freshersService.submitPublicEntry(rawInput);
    if (!result.success) {
      return {
        success: false,
        data: result,
        error: {
          code: result.status === "already_registered" ? "DUPLICATE_ENTRY" : "BAD_REQUEST",
          message: result.message,
        },
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("[PublicAction: submitFreshersCampaignEntryAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
