/**
 * Finance Domain - Expenses Repository Implementation
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { expenses, ExpenseSelect, ExpenseInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class ExpensesRepository extends BaseRepository<
  ExpenseSelect,
  ExpenseInsert,
  Partial<ExpenseInsert>
> {
  protected getTableName(): string {
    return "expenses";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<ExpenseSelect | null> {
    const conditions = [eq(expenses.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(expenses.deletedAt));
    }

    const result = await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<ExpenseSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(expenses.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(expenses)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(expenses)
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

  public async create(data: ExpenseInsert, creatorId: UUID): Promise<ExpenseSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db.insert(expenses).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<ExpenseInsert>,
    updaterId: UUID
  ): Promise<ExpenseSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db
      .update(expenses)
      .set(payload)
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
      .returning();

    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(expenses)
      .set({
        deletedAt: timestamp,
        deletedBy: deleterId,
        updatedAt: timestamp,
        updatedBy: deleterId,
      })
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
      .returning();

    return result.length > 0;
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(expenses)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: timestamp,
        updatedBy: restorerId,
      })
      .where(eq(expenses.id, id))
      .returning();

    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }
}
