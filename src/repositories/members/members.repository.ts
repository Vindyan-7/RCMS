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

    const includeCount = options?.includeCount ?? true;

    const items = await db
      .select()
      .from(members)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    let total = items.length;
    if (includeCount) {
      const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(members)
        .where(whereClause);
      total = Number(totalRes[0]?.count || 0);
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: this.calculateTotalPages(total, limit),
    };
  }

  public async getNextMemberId(yearCode?: string): Promise<string> {
    if (!yearCode) {
      const currentYear = new Date().getFullYear();
      yearCode = String(currentYear).slice(-2);
    }
    const prefix = `SAC-RC-${yearCode}`;
    const result = await db
      .select({ memberId: members.memberId })
      .from(members)
      .where(sql`${members.memberId} LIKE ${prefix + '%'}`)
      .orderBy(sql`LENGTH(${members.memberId}) DESC`, sql`${members.memberId} DESC`)
      .limit(1);

    if (!result[0] || !result[0].memberId) {
      return `${prefix}001`;
    }

    const lastId = result[0].memberId;
    const seqStr = lastId.replace(prefix, "");
    const lastSeq = parseInt(seqStr, 10);
    const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    const paddedSeq = String(nextSeq).padStart(3, "0");
    return `${prefix}${paddedSeq}`;
  }

  public async create(data: MemberInsert, creatorId: UUID): Promise<MemberSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    let yearCode = String(new Date().getFullYear()).slice(-2);
    if (data.academicYear) {
      const match = data.academicYear.match(/\d{4}/);
      if (match) yearCode = match[0].slice(-2);
    }

    const generatedMemberId = data.memberId && data.memberId.startsWith("SAC-RC-")
      ? data.memberId
      : await this.getNextMemberId(yearCode);

    const payload = {
      ...data,
      memberId: generatedMemberId,
      clubMembershipId: data.clubMembershipId || generatedMemberId,
      role: data.role || "Member",
      joinedDate: data.joinedDate ? String(data.joinedDate) : new Date().toISOString().split("T")[0],
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
