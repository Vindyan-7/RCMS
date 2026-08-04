/**
 * Members Domain - Member Repository Implementation
 */

import { eq, or, ilike, and, isNull, sql } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase, isServerless } from "@/db";
import { members, MemberSelect, MemberInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

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

    let items: MemberSelect[] = [];
    if (isServerless) {
      try {
        let queryBuilder = supabase.from("members").select("*").is("deleted_at", null);
        if (query.search) {
          queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,roll_number.ilike.%${query.search}%,member_id.ilike.%${query.search}%,email.ilike.%${query.search}%`);
        }
        const { data } = await queryBuilder;
        if (data && data.length > 0) {
          items = toCamelCase<MemberSelect[]>(data);
        }
      } catch (err) {
        logger.error("[MembersRepository] REST query error", err);
      }
    } else {
      try {
        items = await db
          .select()
          .from(members)
          .where(whereClause)
          .limit(limit)
          .offset(offset);
      } catch (err) {
        logger.error("[MembersRepository] Drizzle query error", err);
      }

      if (items.length === 0 && !query.search) {
        try {
          const { data } = await supabase.from("members").select("*").is("deleted_at", null);
          if (data && data.length > 0) {
            items = toCamelCase<MemberSelect[]>(data);
          }
        } catch (err) {
          logger.error("[MembersRepository] REST fallback error", err);
        }
      }
    }

    let total = items.length;
    if (includeCount) {
      try {
        const totalRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(members)
          .where(whereClause);
        if (totalRes[0]?.count) total = Number(totalRes[0].count);
      } catch {
        total = items.length;
      }
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
    try {
      const result = await db
        .select({ memberId: members.memberId })
        .from(members)
        .where(sql`${members.memberId} LIKE ${prefix + '%'}`)
        .orderBy(sql`LENGTH(${members.memberId}) DESC`, sql`${members.memberId} DESC`)
        .limit(1);

      if (result[0] && result[0].memberId) {
        const lastId = result[0].memberId;
        const seqStr = lastId.replace(prefix, "");
        const lastSeq = parseInt(seqStr, 10);
        const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
        return `${prefix}${String(nextSeq).padStart(3, "0")}`;
      }
    } catch {
      // Fallback via Supabase REST API
    }

    try {
      const { data } = await supabase
        .from("members")
        .select("member_id")
        .like("member_id", `${prefix}%`)
        .order("member_id", { ascending: false })
        .limit(1);
      if (data && data[0] && data[0].member_id) {
        const lastId = data[0].member_id;
        const seqStr = lastId.replace(prefix, "");
        const lastSeq = parseInt(seqStr, 10);
        const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
        return `${prefix}${String(nextSeq).padStart(3, "0")}`;
      }
    } catch {
      // Ignore
    }

    return `${prefix}001`;
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

    try {
      const result = await db.insert(members).values(payload).returning();
      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[MembersRepository] Drizzle insert error, falling back to REST API", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: restResult, error } = await supabase.from("members").insert(snakePayload).select().single();
    if (error || !restResult) {
      throw new Error(`[MembersRepository] Create failed: ${error?.message || "Unknown error"}`);
    }
    return toCamelCase<MemberSelect>(restResult);
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

    try {
      const result = await db
        .update(members)
        .set(payload)
        .where(and(eq(members.id, id), isNull(members.deletedAt)))
        .returning();

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[MembersRepository] Drizzle update error, falling back to REST API", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: restResult, error } = await supabase
      .from("members")
      .update(snakePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !restResult) {
      throw new Error(`[MembersRepository] Update failed: ${error?.message || "Unknown error"}`);
    }
    return toCamelCase<MemberSelect>(restResult);
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
