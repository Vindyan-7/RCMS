"use server";

/**
 * Settings Domain - Server Actions Implementation
 */

import { ApiResponse } from "@/core/types";
import { ConfigurationService, RCMSGlobalConfiguration } from "@/services/settings/configuration.service";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";

const configService = new ConfigurationService();

export async function getConfigurationAction(): Promise<ApiResponse<RCMSGlobalConfiguration>> {
  logger.debug("[Action: getConfigurationAction] Fetching global configuration");
  try {
    const config = await configService.getFullConfiguration();
    return {
      success: true,
      data: config,
    };
  } catch (error) {
    logger.error("[Action: getConfigurationAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function updateConfigurationAction(
  updates: Record<string, string>
): Promise<ApiResponse<RCMSGlobalConfiguration>> {
  logger.info("[Action: updateConfigurationAction] Updating configuration", { keys: Object.keys(updates) });
  try {
    const updatedConfig = await configService.updateSettings(updates);
    return {
      success: true,
      data: updatedConfig,
    };
  } catch (error) {
    logger.error("[Action: updateConfigurationAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
