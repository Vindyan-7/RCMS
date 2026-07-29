/**
 * Points Domain - Points Ledger Repository Implementation (Supabase JS Client)
 */

import { db, toCamelCase, toSnakeCase } from "@/db";
import { PointsLedgerSelect, PointsLedgerInsert } from "@/db/schema";
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
    query: PaginationQuery
  ): Promise<PaginatedResult<LeaderboardItem>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    // Fetch members and their active non-revoked points sum
    const [membersRes, ledgerRes] = await Promise.all([
      db.from("members").select("id, name, roll_number, club_membership_id", { count: "exact" }).is("deleted_at", null),
      db.from(this.tableName).select("member_id, points, is_revoked"),
    ]);

    const membersData = membersRes.data || [];
    const ledgerData = ledgerRes.data || [];

    const pointsMap: Record<string, number> = {};
    for (const entry of ledgerData) {
      if (entry.is_revoked) continue; // Skip revoked ledger entries
      const mId = entry.member_id;
      pointsMap[mId] = (pointsMap[mId] || 0) + (Number(entry.points) || 0);
    }

    const leaderboard: LeaderboardItem[] = membersData.map((m: any) => ({
      memberId: m.id,
      memberName: m.name,
      membershipId: m.club_membership_id || "",
      rollNumber: m.roll_number || "",
      totalPoints: pointsMap[m.id] || 0,
    }));

    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    const total = membersRes.count || leaderboard.length;
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
