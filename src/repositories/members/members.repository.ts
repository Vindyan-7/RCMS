/**
 * Members Domain - Member Repository Implementation
 */

import { eq, or, ilike, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { members, MemberSelect, MemberInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class MembersRepository extends BaseRepository<
  MemberSelect,
  MemberInsert,
  Partial<MemberInsert>
> {
  protected getTableName(): string {
    return "members";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<MemberSelect | null> {
    const conditions = [eq(members.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(members.deletedAt));
    }

    const result = await db
      .select()
      .from(members)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findByMemberId(
    memberId: string,
    options?: { includeDeleted?: boolean }
  ): Promise<MemberSelect | null> {
    const conditions = [eq(members.memberId, memberId)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(members.deletedAt));
    }

    const result = await db
      .select()
      .from(members)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findByRollNumber(
    rollNumber: string,
    options?: { includeDeleted?: boolean }
  ): Promise<MemberSelect | null> {
    const conditions = [eq(members.rollNumber, rollNumber)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(members.deletedAt));
    }

    const result = await db
      .select()
      .from(members)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findByEmail(
    email: string,
    options?: { includeDeleted?: boolean }
  ): Promise<MemberSelect | null> {
    const conditions = [eq(members.email, email)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(members.deletedAt));
    }

    const result = await db
      .select()
      .from(members)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<MemberSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(members.deletedAt));
    }

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      conditions.push(
        or(
          ilike(members.name, searchPattern),
          ilike(members.rollNumber, searchPattern),
          ilike(members.memberId, searchPattern),
          ilike(members.email, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(members)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(members)
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

  public async create(data: MemberInsert, creatorId: UUID): Promise<MemberSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const randomSac = Math.floor(100000 + Math.random() * 900000);

    const payload = {
      ...data,
      memberId: data.memberId || `MEM-2026-${randomSuffix}`,
      clubMembershipId: data.clubMembershipId || `SAC-RC-${randomSac}`,
      role: data.role || "Member",
      joinedDate: data.joinedDate || new Date(),
      ...audit,
    };

    const result = await db.insert(members).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<MemberInsert>,
    updaterId: UUID
  ): Promise<MemberSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db
      .update(members)
      .set(payload)
      .where(and(eq(members.id, id), isNull(members.deletedAt)))
      .returning();

    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(members)
      .set({
        deletedAt: timestamp,
        deletedBy: deleterId,
        updatedAt: timestamp,
        updatedBy: deleterId,
      })
      .where(and(eq(members.id, id), isNull(members.deletedAt)))
      .returning();

    return result.length > 0;
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(members)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: timestamp,
        updatedBy: restorerId,
      })
      .where(eq(members.id, id))
      .returning();

    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db.delete(members).where(eq(members.id, id)).returning();
    return result.length > 0;
  }
}
