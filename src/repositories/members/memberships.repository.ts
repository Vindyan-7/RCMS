/**
 * Members Domain - Memberships Repository Implementation
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { memberships, MembershipSelect, MembershipInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class MembershipsRepository extends BaseRepository<
  MembershipSelect,
  MembershipInsert,
  Partial<MembershipInsert>
> {
  protected getTableName(): string {
    return "memberships";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<MembershipSelect | null> {
    const conditions = [eq(memberships.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(memberships.deletedAt));
    }

    const result = await db
      .select()
      .from(memberships)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findActiveMembership(
    memberId: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<MembershipSelect | null> {
    const conditions = [
      eq(memberships.memberId, memberId),
      eq(memberships.status, "active"),
    ];
    if (!options?.includeDeleted) {
      conditions.push(isNull(memberships.deletedAt));
    }

    const result = await db
      .select()
      .from(memberships)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async getMembershipHistory(
    memberId: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<MembershipSelect[]> {
    const conditions = [eq(memberships.memberId, memberId)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(memberships.deletedAt));
    }

    return db
      .select()
      .from(memberships)
      .where(and(...conditions));
  }

  public async getByAcademicYear(
    academicYearId: UUID,
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<MembershipSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(memberships.academicYearId, academicYearId)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(memberships.deletedAt));
    }

    const whereClause = and(...conditions);

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(memberships)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(memberships)
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

  public async getBySemester(
    semesterId: UUID,
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<MembershipSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(memberships.semesterId, semesterId)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(memberships.deletedAt));
    }

    const whereClause = and(...conditions);

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(memberships)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(memberships)
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

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<MembershipSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(memberships.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(memberships)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(memberships)
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

  public async create(
    data: MembershipInsert,
    creatorId: UUID
  ): Promise<MembershipSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db.insert(memberships).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<MembershipInsert>,
    updaterId: UUID
  ): Promise<MembershipSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db
      .update(memberships)
      .set(payload)
      .where(and(eq(memberships.id, id), isNull(memberships.deletedAt)))
      .returning();

    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(memberships)
      .set({
        deletedAt: timestamp,
        deletedBy: deleterId,
        updatedAt: timestamp,
        updatedBy: deleterId,
      })
      .where(and(eq(memberships.id, id), isNull(memberships.deletedAt)))
      .returning();

    return result.length > 0;
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(memberships)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: timestamp,
        updatedBy: restorerId,
      })
      .where(eq(memberships.id, id))
      .returning();

    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db
      .delete(memberships)
      .where(eq(memberships.id, id))
      .returning();
    return result.length > 0;
  }
}
