/**
 * Points Domain - Point Rules Repository Implementation
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { pointRules, PointRuleSelect, PointRuleInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class PointRulesRepository extends BaseRepository<
  PointRuleSelect,
  PointRuleInsert,
  Partial<PointRuleInsert>
> {
  protected getTableName(): string {
    return "point_rules";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<PointRuleSelect | null> {
    const conditions = [eq(pointRules.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(pointRules.deletedAt));
    }

    const result = await db
      .select()
      .from(pointRules)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findActiveRulesByTrigger(trigger: string): Promise<PointRuleSelect[]> {
    return db
      .select()
      .from(pointRules)
      .where(
        and(
          eq(pointRules.trigger, trigger),
          eq(pointRules.enabled, true),
          isNull(pointRules.deletedAt)
        )
      );
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<PointRuleSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(pointRules.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(pointRules)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(pointRules)
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

  public async create(data: PointRuleInsert, creatorId: UUID): Promise<PointRuleSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db.insert(pointRules).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<PointRuleInsert>,
    updaterId: UUID
  ): Promise<PointRuleSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db
      .update(pointRules)
      .set(payload)
      .where(and(eq(pointRules.id, id), isNull(pointRules.deletedAt)))
      .returning();

    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(pointRules)
      .set({
        deletedAt: timestamp,
        deletedBy: deleterId,
        updatedAt: timestamp,
        updatedBy: deleterId,
      })
      .where(and(eq(pointRules.id, id), isNull(pointRules.deletedAt)))
      .returning();

    return result.length > 0;
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(pointRules)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: timestamp,
        updatedBy: restorerId,
      })
      .where(eq(pointRules.id, id))
      .returning();

    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db.delete(pointRules).where(eq(pointRules.id, id)).returning();
    return result.length > 0;
  }
}
