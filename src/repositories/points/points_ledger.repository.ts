/**
 * Points Domain - Points Ledger Repository Implementation (Supabase JS Client)
 */

import { db, drizzleDb, toCamelCase, toSnakeCase } from "@/db";
import { PointsLedgerSelect, PointsLedgerInsert, members, memberships } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { PaginatedResult } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export interface LeaderboardItem {
  memberId: UUID;
  memberName: string;
  membershipId: string;
  rollNumber: string;
  totalPoints: number;
}

export class PointsLedgerRepository {
  private tableName = "points_ledger";

  public async create(data: PointsLedgerInsert): Promise<PointsLedgerSelect> {
    const payload: any = toSnakeCase(data);
    // created_by is optional — omit if not a valid system user to avoid FK/NOT NULL issues
    delete payload.created_by;

    const { data: result, error } = await db
      .from(this.tableName)
      .insert(payload)
      .select()
      .single();

    if (error || !result) {
      throw new Error(`[PointsLedgerRepository] Create failed: ${error?.message}`);
    }

    return toCamelCase<PointsLedgerSelect>(result);
  }

  public async findById(id: UUID): Promise<PointsLedgerSelect | null> {
    const { data, error } = await db
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return toCamelCase<PointsLedgerSelect>(data);
  }

  public async getByMemberId(
    memberId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<PointsLedgerSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const { data, count, error } = await db
      .from(this.tableName)
      .select("*", { count: "exact" })
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }

    const total = count || data.length;
    return {
      items: toCamelCase<PointsLedgerSelect[]>(data),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  public async calculateMemberTotalPoints(memberId: UUID): Promise<number> {
    const { data, error } = await db
      .from(this.tableName)
      .select("points, is_revoked")
      .eq("member_id", memberId);

    if (error || !data) return 0;
    return data
      .filter((item: any) => !item.is_revoked)
      .reduce((sum: number, item: any) => sum + (Number(item.points) || 0), 0);
  }

  public async getLeaderboard(
    query: PaginationQuery,
    semesterId?: string
  ): Promise<PaginatedResult<LeaderboardItem>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    let enrolledMembers: Array<{ id: string; name: string; rollNumber: string | null; clubMembershipId: string | null; memberId: string }> = [];

    if (semesterId) {
      const rows = await drizzleDb
        .select({
          id: members.id,
          name: members.name,
          rollNumber: members.rollNumber,
          clubMembershipId: members.clubMembershipId,
          memberId: members.memberId,
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
      enrolledMembers = rows;
    } else {
      enrolledMembers = [];
    }

    const { data: ledgerData } = await db.from(this.tableName).select("member_id, points, is_revoked, semester_id");

    const pointsMap: Record<string, number> = {};
    if (ledgerData) {
      for (const entry of ledgerData) {
        if (entry.is_revoked) continue;
        if (semesterId && entry.semester_id && entry.semester_id !== semesterId) continue;
        const mId = entry.member_id;
        pointsMap[mId] = (pointsMap[mId] || 0) + (Number(entry.points) || 0);
      }
    }

    const leaderboard: LeaderboardItem[] = enrolledMembers.map((m) => ({
      memberId: m.id,
      memberName: m.name,
      membershipId: m.memberId || m.clubMembershipId || "",
      rollNumber: m.rollNumber || "",
      totalPoints: pointsMap[m.id] || 0,
    }));

    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    const total = leaderboard.length;
    const items = leaderboard.slice(offset, offset + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
