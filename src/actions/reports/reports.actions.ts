"use server";

/**
 * Reports 2.0 Domain - Server Actions Implementation
 * Single Source of Truth for Report Center & Report Data Preview Engine
 */

import { ApiResponse } from "@/core/types";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { ReportCenterService, ReportCenterInitialResponse, ReportPreviewResult } from "@/services/reports/report-center.service";

const reportCenterService = new ReportCenterService();

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.MEMBERS_VIEW],
  };
}

export async function getReportCenterDataAction(): Promise<ApiResponse<ReportCenterInitialResponse>> {
  logger.info("[Action: getReportCenterDataAction] Initiating Report Center data load");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const data = await reportCenterService.getReportCenterInitialData();

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error("[Action: getReportCenterDataAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function generateReportPreviewAction(
  reportId: string,
  filters: any = {}
): Promise<ApiResponse<ReportPreviewResult>> {
  logger.info(`[Action: generateReportPreviewAction] Generating preview dataset for report ${reportId}`);
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const previewResult = await reportCenterService.getReportPreview(reportId, filters);

    return {
      success: true,
      data: previewResult,
    };
  } catch (error) {
    logger.error("[Action: generateReportPreviewAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
