/**
 * Inventory Domain - Inventory Service Implementation
 */

import { BaseService } from "@/core/service/base-service";
import { InventoryItemsRepository } from "@/repositories/inventory/inventory_items.repository";
import { InventoryBorrowingsRepository } from "@/repositories/inventory/inventory_borrowings.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { CommunicationService } from "@/services/communication/communication.service";
import { InventoryItemSelect, InventoryItemInsert, InventoryBorrowingSelect, InventoryBorrowingInsert } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { NotFoundError, BadRequestError } from "@/core/errors";
import { logger } from "@/core/logger";

export class InventoryService extends BaseService<
  InventoryItemSelect,
  InventoryItemInsert,
  Partial<InventoryItemInsert>
> {
  constructor(
    private readonly itemsRepo: InventoryItemsRepository,
    private readonly borrowingsRepo: InventoryBorrowingsRepository,
    private readonly membersRepo?: MembersRepository,
    private readonly commsService?: CommunicationService
  ) {
    super(itemsRepo, undefined, "InventoryService");
  }

  public async createItem(
    data: any,
    actorId: UUID
  ): Promise<InventoryItemSelect> {
    logger.info("[InventoryService] Creating inventory item", { name: data.name, actorId });
    return this.itemsRepo.create(data, actorId);
  }

  public async updateItem(
    id: UUID,
    data: Partial<InventoryItemInsert>,
    actorId: UUID
  ): Promise<InventoryItemSelect> {
    logger.info("[InventoryService] Updating inventory item", { id, actorId });
    await this.getById(id);
    return this.itemsRepo.update(id, data, actorId);
  }

  public async requestBorrowing(
    data: { inventoryId: UUID; memberId: UUID; quantity?: number },
    actorId: UUID
  ): Promise<InventoryBorrowingSelect> {
    const qty = data.quantity || 1;
    logger.info("[InventoryService] Processing equipment borrowing request", {
      inventoryId: data.inventoryId,
      memberId: data.memberId,
      quantity: qty,
      actorId,
    });

    const item = await this.getById(data.inventoryId);

    if (this.membersRepo) {
      const member = await this.membersRepo.findById(data.memberId);
      if (!member) {
        throw new NotFoundError(`Member ${data.memberId} not found`, "MEMBER_NOT_FOUND");
      }
    }

    if (item.available < qty) {
      logger.warn("[InventoryService] Low stock for borrowing request", {
        inventoryId: data.inventoryId,
        available: item.available,
        requested: qty,
      });
      throw new BadRequestError(
        `Insufficient available quantity (${item.available} available, ${qty} requested)`,
        "LOW_STOCK"
      );
    }

    const borrowing = await this.borrowingsRepo.create({
      inventoryId: data.inventoryId,
      memberId: data.memberId,
      quantity: qty,
      status: "requested",
    });

    if (this.commsService) {
      await this.commsService.sendNotification({
        recipientId: data.memberId,
        title: "Borrowing Request Received",
        message: `Your request to borrow ${item.name} (Qty: ${qty}) has been logged.`,
      });
    }

    return borrowing;
  }

  public async issueBorrowing(
    borrowingId: UUID,
    dueDate: Date,
    actorId: UUID
  ): Promise<InventoryBorrowingSelect> {
    logger.info("[InventoryService] Issuing equipment borrowing", { borrowingId, actorId });

    const borrowing = await this.borrowingsRepo.findById(borrowingId);
    if (!borrowing) {
      throw new NotFoundError(`Borrowing request ${borrowingId} not found`);
    }

    if (borrowing.status !== "requested" && borrowing.status !== "approved") {
      throw new BadRequestError(`Cannot issue borrowing in ${borrowing.status} status`);
    }

    // Deduct stock quantity
    await this.itemsRepo.updateAvailableQuantity(borrowing.inventoryId, -borrowing.quantity, actorId);

    const updated = await this.borrowingsRepo.update(borrowingId, {
      status: "issued",
      issueDate: new Date(),
      dueDate,
      issuedBy: actorId,
    });

    if (this.commsService) {
      await this.commsService.sendNotification({
        recipientId: borrowing.memberId,
        title: "Equipment Issued",
        message: `Equipment has been issued. Due date for return is ${dueDate.toDateString()}.`,
      });
    }

    return updated;
  }

  public async returnBorrowing(
    borrowingId: UUID,
    conditionOnReturn: string = "good",
    remarks?: string,
    actorId?: UUID
  ): Promise<InventoryBorrowingSelect> {
    logger.info("[InventoryService] Processing equipment return", { borrowingId, conditionOnReturn, actorId });

    const borrowing = await this.borrowingsRepo.findById(borrowingId);
    if (!borrowing) {
      throw new NotFoundError(`Borrowing record ${borrowingId} not found`);
    }

    if (borrowing.status !== "issued" && borrowing.status !== "overdue") {
      throw new BadRequestError(`Cannot return borrowing in ${borrowing.status} status`);
    }

    // Restore stock quantity
    await this.itemsRepo.updateAvailableQuantity(borrowing.inventoryId, borrowing.quantity, actorId || "00000000-0000-0000-0000-000000000001");

    return this.borrowingsRepo.update(borrowingId, {
      status: "returned",
      returnDate: new Date(),
      conditionOnReturn,
      returnedBy: actorId,
      remarks,
    });
  }

  public async getMemberBorrowings(
    memberId: UUID,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<InventoryBorrowingSelect>> {
    return this.borrowingsRepo.getByMemberId(memberId, pagination);
  }

  public async getAllItems(
    pagination: PaginationQuery
  ): Promise<PaginatedResult<InventoryItemSelect>> {
    return this.itemsRepo.findAll(pagination);
  }
}
