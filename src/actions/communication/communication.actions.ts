"use server";

/**
 * Communication Domain - Server Actions Implementation
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { NotificationSelect, NotificationTemplateSelect } from "@/db/schema";
import { NotificationsRepository, NotificationTemplatesRepository } from "@/repositories/communication";
import { MembersRepository } from "@/repositories/members";
import { CommunicationService } from "@/services/communication";
import { CommunicationValidator } from "@/validation/communication";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";

const notificationsRepo = new NotificationsRepository();
const templatesRepo = new NotificationTemplatesRepository();
const membersRepo = new MembersRepository();
const commsService = new CommunicationService(notificationsRepo, templatesRepo, membersRepo);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.SETTINGS_EDIT, PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.MEMBERS_VIEW],
  };
}

export async function sendNotificationAction(
  rawInput: unknown
): Promise<ApiResponse<NotificationSelect>> {
  logger.info("[Action: sendNotificationAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.SETTINGS_EDIT);

    const validatedInput = await CommunicationValidator.validateSend(rawInput);
    const notification = await commsService.sendNotification(validatedInput, actor.id);

    logger.info("[Action: sendNotificationAction] Action completed successfully", { id: notification.id });

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    logger.error("[Action: sendNotificationAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function broadcastNotificationAction(
  rawInput: unknown
): Promise<ApiResponse<NotificationSelect[]>> {
  logger.info("[Action: broadcastNotificationAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.SETTINGS_EDIT);

    const validatedInput = await CommunicationValidator.validateBroadcast(rawInput);
    const notificationsList = await commsService.broadcastNotification(
      validatedInput.recipientIds,
      validatedInput.title,
      validatedInput.message,
      actor.id
    );

    return {
      success: true,
      data: notificationsList,
    };
  } catch (error) {
    logger.error("[Action: broadcastNotificationAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function markNotificationAsReadAction(
  id: string
): Promise<ApiResponse<NotificationSelect>> {
  logger.info("[Action: markNotificationAsReadAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    const notification = await commsService.markAsRead(id);

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    logger.error("[Action: markNotificationAsReadAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getMemberNotificationsAction(
  recipientId: string,
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<NotificationSelect>>> {
  logger.debug("[Action: getMemberNotificationsAction] Initiating action execution", { recipientId });
  try {
    const actor = await getActorContext();
    const notificationsList = await commsService.getMemberNotifications(recipientId, pagination || {});

    return {
      success: true,
      data: notificationsList,
    };
  } catch (error) {
    logger.error("[Action: getMemberNotificationsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function createNotificationTemplateAction(
  rawInput: unknown
): Promise<ApiResponse<NotificationTemplateSelect>> {
  logger.info("[Action: createNotificationTemplateAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.SETTINGS_EDIT);

    const validatedInput = await CommunicationValidator.validateTemplate(rawInput);
    const template = await commsService.createTemplate(validatedInput, actor.id);

    return {
      success: true,
      data: template,
    };
  } catch (error) {
    logger.error("[Action: createNotificationTemplateAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getTemplatesAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<NotificationTemplateSelect>>> {
  logger.debug("[Action: getTemplatesAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.SETTINGS_VIEW);

    const templates = await commsService.getAllTemplates(pagination || {});

    return {
      success: true,
      data: templates,
    };
  } catch (error) {
    logger.error("[Action: getTemplatesAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getAllNotificationsAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<NotificationSelect>>> {
  logger.debug("[Action: getAllNotificationsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.SETTINGS_VIEW);

    const notificationsList = await commsService.getAllNotifications(pagination || {});

    return {
      success: true,
      data: notificationsList,
    };
  } catch (error) {
    logger.error("[Action: getAllNotificationsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
