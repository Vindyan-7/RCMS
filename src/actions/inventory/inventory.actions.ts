"use server";

/**
 * Inventory Domain - Server Actions Implementation
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { InventoryItemSelect, InventoryBorrowingSelect } from "@/db/schema";
import { InventoryItemsRepository, InventoryBorrowingsRepository } from "@/repositories/inventory";
import { MembersRepository } from "@/repositories/members";
import { NotificationsRepository, NotificationTemplatesRepository } from "@/repositories/communication";
import { CommunicationService } from "@/services/communication";
import { InventoryService } from "@/services/inventory";
import { InventoryValidator } from "@/validation/inventory";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";

const itemsRepo = new InventoryItemsRepository();
const borrowingsRepo = new InventoryBorrowingsRepository();
const membersRepo = new MembersRepository();
const commsService = new CommunicationService(
  new NotificationsRepository(),
  new NotificationTemplatesRepository(),
  membersRepo
);
const inventoryService = new InventoryService(itemsRepo, borrowingsRepo, membersRepo, commsService);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [
      PERMISSIONS.INVENTORY_CREATE,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_EDIT,
      PERMISSIONS.INVENTORY_ISSUE,
      PERMISSIONS.INVENTORY_RETURN,
    ],
  };
}

export async function createInventoryItemAction(
  rawInput: unknown
): Promise<ApiResponse<InventoryItemSelect>> {
  logger.info("[Action: createInventoryItemAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.INVENTORY_CREATE);

    const validatedInput = await InventoryValidator.validateCreateItem(rawInput);
    const item = await inventoryService.createItem(validatedInput, actor.id);

    logger.info("[Action: createInventoryItemAction] Action completed successfully", { id: item.id });

    return {
      success: true,
      data: item,
    };
  } catch (error) {
    logger.error("[Action: createInventoryItemAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function updateInventoryItemAction(
  id: string,
  rawInput: unknown
): Promise<ApiResponse<InventoryItemSelect>> {
  logger.info("[Action: updateInventoryItemAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.INVENTORY_EDIT);

    const validatedInput = await InventoryValidator.validateUpdateItem(rawInput);
    const item = await inventoryService.updateItem(id, validatedInput, actor.id);

    return {
      success: true,
      data: item,
    };
  } catch (error) {
    logger.error("[Action: updateInventoryItemAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function requestBorrowingAction(
  rawInput: unknown
): Promise<ApiResponse<InventoryBorrowingSelect>> {
  logger.info("[Action: requestBorrowingAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.INVENTORY_VIEW);

    const validatedInput = await InventoryValidator.validateRequestBorrowing(rawInput);
    const borrowing = await inventoryService.requestBorrowing(validatedInput, actor.id);

    return {
      success: true,
      data: borrowing,
    };
  } catch (error) {
    logger.error("[Action: requestBorrowingAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function issueBorrowingAction(
  rawInput: unknown
): Promise<ApiResponse<InventoryBorrowingSelect>> {
  logger.info("[Action: issueBorrowingAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.INVENTORY_ISSUE);

    const validatedInput = await InventoryValidator.validateIssueBorrowing(rawInput);
    const borrowing = await inventoryService.issueBorrowing(
      validatedInput.borrowingId,
      validatedInput.dueDate,
      actor.id
    );

    return {
      success: true,
      data: borrowing,
    };
  } catch (error) {
    logger.error("[Action: issueBorrowingAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function returnBorrowingAction(
  rawInputOrId: unknown,
  conditionParam?: string
): Promise<ApiResponse<InventoryBorrowingSelect>> {
  logger.info("[Action: returnBorrowingAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.INVENTORY_RETURN);

    let borrowingId: string;
    let conditionOnReturn: string = "good";

    if (typeof rawInputOrId === "string") {
      borrowingId = rawInputOrId;
      conditionOnReturn = conditionParam || "good";
    } else {
      const validatedInput = await InventoryValidator.validateReturnBorrowing(rawInputOrId);
      borrowingId = validatedInput.borrowingId;
      conditionOnReturn = validatedInput.conditionOnReturn || "good";
    }

    const borrowing = await inventoryService.returnBorrowing(
      borrowingId,
      conditionOnReturn,
      undefined,
      actor.id
    );

    return {
      success: true,
      data: borrowing,
    };
  } catch (error) {
    logger.error("[Action: returnBorrowingAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getMemberBorrowingsAction(
  memberId: string,
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<InventoryBorrowingSelect>>> {
  logger.debug("[Action: getMemberBorrowingsAction] Initiating action execution", { memberId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.INVENTORY_VIEW);

    const borrowings = await inventoryService.getMemberBorrowings(memberId, pagination || {});

    return {
      success: true,
      data: borrowings,
    };
  } catch (error) {
    logger.error("[Action: getMemberBorrowingsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getInventoryItemsAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<InventoryItemSelect>>> {
  logger.debug("[Action: getInventoryItemsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.INVENTORY_VIEW);

    const items = await inventoryService.getAllItems(pagination || {});

    return {
      success: true,
      data: items,
    };
  } catch (error) {
    logger.error("[Action: getInventoryItemsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
