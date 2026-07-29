"use server";

/**
 * Intelligence Layer - Server Actions Implementation
 */

import { ApiResponse } from "@/core/types";
import { DashboardService, DashboardMetricsResponse, KpiService, KpiMetricsResponse, UniversalSearchService, UniversalSearchResultItem, InsightsService, SystemInsightItem } from "@/services/intelligence";
import { IntelligenceValidator } from "@/validation/intelligence";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";

const dashboardService = new DashboardService();
const kpiService = new KpiService();
const searchService = new UniversalSearchService();
const insightsService = new InsightsService();

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.MEMBERS_VIEW],
  };
}

export async function getExecutiveDashboardMetricsAction(): Promise<ApiResponse<DashboardMetricsResponse>> {
  logger.info("[Action: getExecutiveDashboardMetricsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.SETTINGS_VIEW);

    const metrics = await dashboardService.getExecutiveDashboardMetrics();

    return {
      success: true,
      data: metrics,
    };
  } catch (error) {
    logger.error("[Action: getExecutiveDashboardMetricsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getKpiMetricsAction(): Promise<ApiResponse<KpiMetricsResponse>> {
  logger.info("[Action: getKpiMetricsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.SETTINGS_VIEW);

    const kpis = await kpiService.getKpiMetrics();

    return {
      success: true,
      data: kpis,
    };
  } catch (error) {
    logger.error("[Action: getKpiMetricsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function universalSearchAction(
  rawInput: unknown
): Promise<ApiResponse<UniversalSearchResultItem[]>> {
  logger.info("[Action: universalSearchAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const validatedInput = await IntelligenceValidator.validateSearch(rawInput);
    const searchResults = await searchService.searchAll(validatedInput.query);

    return {
      success: true,
      data: searchResults,
    };
  } catch (error) {
    logger.error("[Action: universalSearchAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getSystemInsightsAction(): Promise<ApiResponse<SystemInsightItem[]>> {
  logger.info("[Action: getSystemInsightsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.SETTINGS_VIEW);

    const insights = await insightsService.getSystemInsights();

    return {
      success: true,
      data: insights,
    };
  } catch (error) {
    logger.error("[Action: getSystemInsightsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
