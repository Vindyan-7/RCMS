/**
 * Inventory Domain - Inventory Borrowings Repository Implementation
 */

import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { inventoryBorrowings, InventoryBorrowingSelect, InventoryBorrowingInsert } from "@/db/schema";
import { PaginatedResult } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class InventoryBorrowingsRepository {
  public async create(data: InventoryBorrowingInsert): Promise<InventoryBorrowingSelect> {
    const result = await db.insert(inventoryBorrowings).values(data).returning();
    return result[0];
  }

  public async findById(id: UUID): Promise<InventoryBorrowingSelect | null> {
    const result = await db
      .select()
      .from(inventoryBorrowings)
      .where(eq(inventoryBorrowings.id, id))
      .limit(1);

    return result[0] || null;
  }

  public async getByMemberId(
    memberId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<InventoryBorrowingSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClause = eq(inventoryBorrowings.memberId, memberId);

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(inventoryBorrowings)
        .where(whereClause)
        .orderBy(desc(inventoryBorrowings.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryBorrowings)
        .where(whereClause),
    ]);

    const total = Number(totalRes[0]?.count || 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async update(
    id: UUID,
    data: Partial<InventoryBorrowingInsert>
  ): Promise<InventoryBorrowingSelect> {
    const result = await db
      .update(inventoryBorrowings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(inventoryBorrowings.id, id))
      .returning();

    return result[0];
  }
}
