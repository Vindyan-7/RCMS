/**
 * Finance Domain - Sponsors Repository Implementation
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { sponsors, SponsorSelect, SponsorInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class SponsorsRepository extends BaseRepository<
  SponsorSelect,
  SponsorInsert,
  Partial<SponsorInsert>
> {
  protected getTableName(): string {
    return "sponsors";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<SponsorSelect | null> {
    const conditions = [eq(sponsors.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(sponsors.deletedAt));
    }

    const result = await db
      .select()
      .from(sponsors)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<SponsorSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(sponsors.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(sponsors)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sponsors)
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

  public async create(data: SponsorInsert, creatorId: UUID): Promise<SponsorSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db.insert(sponsors).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<SponsorInsert>,
    updaterId: UUID
  ): Promise<SponsorSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db
      .update(sponsors)
      .set(payload)
      .where(and(eq(sponsors.id, id), isNull(sponsors.deletedAt)))
      .returning();

    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(sponsors)
      .set({
        deletedAt: timestamp,
        deletedBy: deleterId,
        updatedAt: timestamp,
        updatedBy: deleterId,
      })
      .where(and(eq(sponsors.id, id), isNull(sponsors.deletedAt)))
      .returning();

    return result.length > 0;
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(sponsors)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: timestamp,
        updatedBy: restorerId,
      })
      .where(eq(sponsors.id, id))
      .returning();

    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db.delete(sponsors).where(eq(sponsors.id, id)).returning();
    return result.length > 0;
  }
}
