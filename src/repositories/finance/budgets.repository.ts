/**
 * Finance Domain - Budgets Repository Implementation
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { budgets, BudgetSelect, BudgetInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class BudgetsRepository extends BaseRepository<
  BudgetSelect,
  BudgetInsert,
  Partial<BudgetInsert>
> {
  protected getTableName(): string {
    return "budgets";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<BudgetSelect | null> {
    const conditions = [eq(budgets.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(budgets.deletedAt));
    }

    const result = await db
      .select()
      .from(budgets)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<BudgetSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(budgets.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(budgets)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(budgets)
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

  public async updateUtilizedAmount(
    id: UUID,
    amount: number,
    updaterId: UUID
  ): Promise<BudgetSelect> {
    const budget = await this.findById(id);
    if (!budget) throw new Error("Budget not found");

    const newUtilized = budget.utilizedAmount + amount;

    const result = await db
      .update(budgets)
      .set({
        utilizedAmount: newUtilized,
        updatedBy: updaterId,
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, id))
      .returning();

    return result[0];
  }

  public async create(data: BudgetInsert, creatorId: UUID): Promise<BudgetSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db.insert(budgets).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<BudgetInsert>,
    updaterId: UUID
  ): Promise<BudgetSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db
      .update(budgets)
      .set(payload)
      .where(and(eq(budgets.id, id), isNull(budgets.deletedAt)))
      .returning();

    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(budgets)
      .set({
        deletedAt: timestamp,
        deletedBy: deleterId,
        updatedAt: timestamp,
        updatedBy: deleterId,
      })
      .where(and(eq(budgets.id, id), isNull(budgets.deletedAt)))
      .returning();

    return result.length > 0;
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(budgets)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: timestamp,
        updatedBy: restorerId,
      })
      .where(eq(budgets.id, id))
      .returning();

    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db.delete(budgets).where(eq(budgets.id, id)).returning();
    return result.length > 0;
  }
}
