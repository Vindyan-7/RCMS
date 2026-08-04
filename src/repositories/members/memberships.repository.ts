/**
 * Members Domain - Memberships Repository Implementation
 * Serverless REST execution support added to prevent getaddrinfo ENOTFOUND on Vercel
 */

import { eq, and, isNull, sql, inArray } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase, isServerless } from "@/db";
import { memberships, members, MembershipSelect, MembershipInsert, MemberSelect } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class MembershipsRepository extends BaseRepository<
  MembershipSelect,
  MembershipInsert,
  Partial<MembershipInsert>
> {
  protected getTableName(): string {
    return "memberships";
  }

  /**
   * Fetch all active memberships joined with full member directory profiles for a given semester.
   */
  public async findEnrolledMembersWithProfiles(
    semesterId: UUID
  ): Promise<Array<{ membership: MembershipSelect; member: MemberSelect }>> {
    if (isServerless) {
      try {
        const { data: memsData } = await supabase
          .from("memberships")
          .select("*, members(*)")
          .eq("semester_id", semesterId)
          .eq("status", "active")
          .is("deleted_at", null);

        if (memsData && memsData.length > 0) {
          return memsData
            .filter((row: any) => row.members !== null)
            .map((row: any) => ({
              membership: toCamelCase<MembershipSelect>(row),
              member: toCamelCase<MemberSelect>(row.members),
            }));
        }
      } catch (err) {
        logger.error("[MembershipsRepository] REST query error", err);
      }
    }

    try {
      const rows = await db
        .select({
          membership: memberships,
          member: members,
        })
        .from(memberships)
        .innerJoin(members, eq(memberships.memberId, members.id))
        .where(
          and(
            eq(memberships.semesterId, semesterId),
            eq(memberships.status, "active"),
            isNull(memberships.deletedAt),
            isNull(members.deletedAt)
          )
        );

      if (rows && rows.length > 0) return rows;
    } catch (err) {
      logger.error("[MembershipsRepository] Drizzle findEnrolledMembersWithProfiles error", err);
    }

    try {
      const { data: memsData } = await supabase
        .from("memberships")
        .select("*, members(*)")
        .eq("semester_id", semesterId)
        .eq("status", "active")
        .is("deleted_at", null);

      if (memsData && memsData.length > 0) {
        return memsData
          .filter((row: any) => row.members !== null)
          .map((row: any) => ({
            membership: toCamelCase<MembershipSelect>(row),
            member: toCamelCase<MemberSelect>(row.members),
          }));
      }
    } catch (restErr) {
      logger.error("[MembershipsRepository] REST fallback error", restErr);
    }

    return [];
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<MembershipSelect | null> {
    if (isServerless) {
      try {
        let query = supabase.from("memberships").select("*").eq("id", id);
        if (!options?.includeDeleted) {
          query = query.is("deleted_at", null);
        }
        const { data } = await query.limit(1);
        if (data && data[0]) return toCamelCase<MembershipSelect>(data[0]);
      } catch (err) {
        logger.error("[MembershipsRepository] REST findById error", err);
      }
    }

    try {
      const conditions = [eq(memberships.id, id)];
      if (!options?.includeDeleted) {
        conditions.push(isNull(memberships.deletedAt));
      }

      const result = await db
        .select()
        .from(memberships)
        .where(and(...conditions))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[MembershipsRepository] Drizzle findById error", err);
    }

    try {
      let query = supabase.from("memberships").select("*").eq("id", id);
      if (!options?.includeDeleted) {
        query = query.is("deleted_at", null);
      }
      const { data } = await query.limit(1);
      if (data && data[0]) return toCamelCase<MembershipSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findActiveMembership(
    memberId: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<MembershipSelect | null> {
    if (isServerless) {
      try {
        let query = supabase
          .from("memberships")
          .select("*")
          .eq("member_id", memberId)
          .eq("status", "active");
        if (!options?.includeDeleted) {
          query = query.is("deleted_at", null);
        }
        const { data } = await query.limit(1);
        if (data && data[0]) return toCamelCase<MembershipSelect>(data[0]);
      } catch (err) {
        logger.error("[MembershipsRepository] REST findActiveMembership error", err);
      }
    }

    try {
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

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[MembershipsRepository] Drizzle findActiveMembership error", err);
    }

    try {
      const { data } = await supabase
        .from("memberships")
        .select("*")
        .eq("member_id", memberId)
        .eq("status", "active")
        .is("deleted_at", null)
        .limit(1);
      if (data && data[0]) return toCamelCase<MembershipSelect>(data[0]);
    } catch {}

    return null;
  }

  /**
   * Batch: fetch the active membership for every member in the list.
   * Single query — eliminates N+1 on the semesters page.
   */
  public async findAllActiveMemberships(
    memberIds: UUID[]
  ): Promise<Record<string, MembershipSelect>> {
    if (memberIds.length === 0) return {};

    if (isServerless) {
      try {
        const { data } = await supabase
          .from("memberships")
          .select("*")
          .in("member_id", memberIds)
          .eq("status", "active")
          .is("deleted_at", null);
        if (data && data.length > 0) {
          const rows = toCamelCase<MembershipSelect[]>(data);
          return rows.reduce((acc: Record<string, MembershipSelect>, row: MembershipSelect) => {
            acc[row.memberId] = row;
            return acc;
          }, {});
        }
      } catch (err) {
        logger.error("[MembershipsRepository] REST findAllActiveMemberships error", err);
      }
    }

    let rows: MembershipSelect[] = [];
    try {
      rows = await db
        .select()
        .from(memberships)
        .where(
          and(
            inArray(memberships.memberId, memberIds),
            eq(memberships.status, "active"),
            isNull(memberships.deletedAt)
          )
        );
    } catch (err) {
      logger.error("[MembershipsRepository] Drizzle findAllActiveMemberships error", err);
    }

    if (rows.length === 0) {
      try {
        const { data } = await supabase
          .from("memberships")
          .select("*")
          .in("member_id", memberIds)
          .eq("status", "active")
          .is("deleted_at", null);
        if (data && data.length > 0) {
          rows = toCamelCase<MembershipSelect[]>(data);
        }
      } catch {}
    }

    return rows.reduce((acc: Record<string, MembershipSelect>, row: MembershipSelect) => {
      acc[row.memberId] = row;
      return acc;
    }, {});
  }

  public async getMembershipHistory(
    memberId: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<MembershipSelect[]> {
    if (isServerless) {
      try {
        let query = supabase.from("memberships").select("*").eq("member_id", memberId);
        if (!options?.includeDeleted) {
          query = query.is("deleted_at", null);
        }
        const { data } = await query;
        if (data) return toCamelCase<MembershipSelect[]>(data);
      } catch (err) {
        logger.error("[MembershipsRepository] REST getMembershipHistory error", err);
      }
    }

    try {
      const conditions = [eq(memberships.memberId, memberId)];
      if (!options?.includeDeleted) {
        conditions.push(isNull(memberships.deletedAt));
      }

      return await db
        .select()
        .from(memberships)
        .where(and(...conditions));
    } catch (err) {
      logger.error("[MembershipsRepository] Drizzle getMembershipHistory error", err);
    }

    try {
      let query = supabase.from("memberships").select("*").eq("member_id", memberId);
      if (!options?.includeDeleted) {
        query = query.is("deleted_at", null);
      }
      const { data } = await query;
      if (data) return toCamelCase<MembershipSelect[]>(data);
    } catch {}

    return [];
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

    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(payload);
        const { data: inserted, error } = await supabase
          .from("memberships")
          .insert(snakePayload)
          .select()
          .single();

        if (!error && inserted) {
          return toCamelCase<MembershipSelect>(inserted);
        } else if (error) {
          logger.error("[MembershipsRepository] REST create error response", error);
        }
      } catch (err) {
        logger.error("[MembershipsRepository] REST create exception", err);
      }
    }

    try {
      const result = await db.insert(memberships).values(payload).returning();
      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[MembershipsRepository] Drizzle create error", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: inserted, error } = await supabase
      .from("memberships")
      .insert(snakePayload)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create membership: ${error.message}`);
    }

    return toCamelCase<MembershipSelect>(inserted);
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

    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(payload);
        const { data: updated, error } = await supabase
          .from("memberships")
          .update(snakePayload)
          .eq("id", id)
          .is("deleted_at", null)
          .select()
          .single();

        if (!error && updated) {
          return toCamelCase<MembershipSelect>(updated);
        } else if (error) {
          logger.error("[MembershipsRepository] REST update error response", error);
        }
      } catch (err) {
        logger.error("[MembershipsRepository] REST update exception", err);
      }
    }

    try {
      const result = await db
        .update(memberships)
        .set(payload)
        .where(and(eq(memberships.id, id), isNull(memberships.deletedAt)))
        .returning();

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[MembershipsRepository] Drizzle update error", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: updated, error } = await supabase
      .from("memberships")
      .update(snakePayload)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update membership: ${error.message}`);
    }

    return toCamelCase<MembershipSelect>(updated);
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    if (isServerless) {
      try {
        const { error } = await supabase
          .from("memberships")
          .update({
            deleted_at: timestamp.toISOString(),
            deleted_by: deleterId,
            updated_at: timestamp.toISOString(),
            updated_by: deleterId,
          })
          .eq("id", id);

        if (!error) return true;
      } catch (err) {
        logger.error("[MembershipsRepository] REST delete error", err);
      }
    }

    try {
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
    } catch (err) {
      logger.error("[MembershipsRepository] Drizzle delete error", err);
      return false;
    }
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
