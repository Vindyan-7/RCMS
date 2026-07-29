/**
 * Inventory Domain - Inventory Items Repository Implementation
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { inventoryItems, InventoryItemSelect, InventoryItemInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class InventoryItemsRepository extends BaseRepository<
  InventoryItemSelect,
  InventoryItemInsert,
  Partial<InventoryItemInsert>
> {
  protected getTableName(): string {
    return "inventory_items";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<InventoryItemSelect | null> {
    const conditions = [eq(inventoryItems.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(inventoryItems.deletedAt));
    }

    const result = await db
      .select()
      .from(inventoryItems)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<InventoryItemSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(inventoryItems.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(inventoryItems)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryItems)
        .where(whereClause),
    ]);

    const total = Number(totalRes[0]?.count || 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: this.calculateTotalPages(total, limit),
    };
  }

  public async updateAvailableQuantity(
    id: UUID,
    delta: number,
    updaterId: UUID
  ): Promise<InventoryItemSelect> {
    const item = await this.findById(id);
    if (!item) throw new Error("Inventory item not found");

    const newAvailable = item.available + delta;

    const result = await db
      .update(inventoryItems)
      .set({
        available: newAvailable,
        updatedBy: updaterId,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();

    return result[0];
  }

  public async create(
    data: InventoryItemInsert,
    creatorId: UUID
  ): Promise<InventoryItemSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = {
      ...data,
      available: data.available ?? data.quantity,
      ...audit,
    };

    const result = await db.insert(inventoryItems).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<InventoryItemInsert>,
    updaterId: UUID
  ): Promise<InventoryItemSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db
      .update(inventoryItems)
      .set(payload)
      .where(and(eq(inventoryItems.id, id), isNull(inventoryItems.deletedAt)))
      .returning();

    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(inventoryItems)
      .set({
        deletedAt: timestamp,
        deletedBy: deleterId,
        updatedAt: timestamp,
        updatedBy: deleterId,
      })
      .where(and(eq(inventoryItems.id, id), isNull(inventoryItems.deletedAt)))
      .returning();

    return result.length > 0;
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(inventoryItems)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: timestamp,
        updatedBy: restorerId,
      })
      .where(eq(inventoryItems.id, id))
      .returning();

    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id)).returning();
    return result.length > 0;
  }
}
