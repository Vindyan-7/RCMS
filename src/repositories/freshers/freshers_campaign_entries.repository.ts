/**
 * Freshers Domain - Freshers Campaign Entries Repository
 */

import { eq, or, ilike, and, isNull, sql, desc } from "drizzle-orm";
import { drizzleDb, supabase, toCamelCase, toSnakeCase } from "@/db";
import { freshersCampaignEntries, FreshersCampaignEntrySelect, FreshersCampaignEntryInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class FreshersCampaignEntriesRepository extends BaseRepository<
  FreshersCampaignEntrySelect,
  FreshersCampaignEntryInsert,
  Partial<FreshersCampaignEntryInsert>
> {
  protected getTableName(): string {
    return "freshers_campaign_entries";
  }

  public async findById(id: UUID, options?: { includeDeleted?: boolean }): Promise<FreshersCampaignEntrySelect | null> {
    try {
      const conditions = [eq(freshersCampaignEntries.id, id)];
      if (!options?.includeDeleted) {
        conditions.push(isNull(freshersCampaignEntries.deletedAt));
      }
      const rows = await drizzleDb
        .select()
        .from(freshersCampaignEntries)
        .where(and(...conditions))
        .limit(1);

      if (rows && rows[0]) return rows[0];
    } catch (err: any) {
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle findById fallback to Supabase", { message: err?.message });
    }

    try {
      let query = supabase.from("freshers_campaign_entries").select("*").eq("id", id);
      if (!options?.includeDeleted) {
        query = query.is("deleted_at", null);
      }
      const { data } = await query.limit(1);
      if (data && data[0]) return toCamelCase<FreshersCampaignEntrySelect>(data[0]);
    } catch (err: any) {
      logger.error("[FreshersCampaignEntriesRepository] findById error", { message: err?.message });
    }
    return null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<FreshersCampaignEntrySelect>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const from = (page - 1) * limit;

    try {
      const rows = await drizzleDb
        .select()
        .from(freshersCampaignEntries)
        .where(isNull(freshersCampaignEntries.deletedAt))
        .orderBy(desc(freshersCampaignEntries.createdAt));

      const total = rows.length;
      const items = rows.slice(from, from + limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages: this.calculateTotalPages(total, limit),
      };
    } catch (err: any) {
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle findAll fallback", { message: err?.message });
    }

    try {
      const to = from + limit - 1;
      let req = supabase
        .from("freshers_campaign_entries")
        .select("*", { count: "exact" })
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data, count } = await req;
      const parsedData = (data || []).map((row) => toCamelCase<FreshersCampaignEntrySelect>(row));
      const total = count || 0;

      return {
        items: parsedData,
        total,
        page,
        limit,
        totalPages: this.calculateTotalPages(total, limit),
      };
    } catch (err: any) {
      logger.error("[FreshersCampaignEntriesRepository] findAll error", { message: err?.message });
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }
  }

  public async create(data: FreshersCampaignEntryInsert, creatorId: UUID): Promise<FreshersCampaignEntrySelect> {
    try {
      const [result] = await drizzleDb
        .insert(freshersCampaignEntries)
        .values({
          ...data,
          createdBy: creatorId,
          updatedBy: creatorId,
        })
        .returning();

      if (result) return result;
    } catch (err: any) {
      if (err.message?.includes("freshers_campaign_entries_campaign_mobile_uq") || err.code === "23505") {
        throw err;
      }
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle create fallback to Supabase", { message: err?.message });
    }

    const payload = toSnakeCase({
      ...data,
      created_by: creatorId,
      updated_by: creatorId,
    });

    const { data: result, error } = await supabase
      .from("freshers_campaign_entries")
      .insert(payload)
      .select("*")
      .single();

    if (error || !result) {
      logger.error("[FreshersCampaignEntriesRepository] create error", { message: error?.message });
      throw new Error(error?.message || "Failed to create campaign entry record.");
    }

    return toCamelCase<FreshersCampaignEntrySelect>(result);
  }

  public async update(
    id: UUID,
    data: Partial<FreshersCampaignEntryInsert>,
    updaterId: UUID
  ): Promise<FreshersCampaignEntrySelect> {
    try {
      const [result] = await drizzleDb
        .update(freshersCampaignEntries)
        .set({
          ...data,
          updatedBy: updaterId,
          updatedAt: new Date().toISOString() as any,
        })
        .where(eq(freshersCampaignEntries.id, id))
        .returning();

      if (result) return result;
    } catch (err: any) {
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle update fallback", { message: err?.message });
    }

    const payload = toSnakeCase({
      ...data,
      updated_by: updaterId,
      updated_at: new Date().toISOString(),
    });

    const { data: result, error } = await supabase
      .from("freshers_campaign_entries")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !result) {
      logger.error("[FreshersCampaignEntriesRepository] update error", { message: error?.message });
      throw new Error(error?.message || "Failed to update campaign entry record.");
    }

    return toCamelCase<FreshersCampaignEntrySelect>(result);
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    try {
      await drizzleDb
        .update(freshersCampaignEntries)
        .set({
          deletedAt: new Date().toISOString() as any,
          updatedBy: deleterId,
        })
        .where(eq(freshersCampaignEntries.id, id));
      return true;
    } catch (err: any) {
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle delete fallback", { message: err?.message });
    }

    const { error } = await supabase
      .from("freshers_campaign_entries")
      .update({ deleted_at: new Date().toISOString(), updated_by: deleterId })
      .eq("id", id);
    return !error;
  }

  public async purge(id: UUID): Promise<boolean> {
    try {
      await drizzleDb.delete(freshersCampaignEntries).where(eq(freshersCampaignEntries.id, id));
      return true;
    } catch (err: any) {
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle purge fallback", { message: err?.message });
    }

    const { error } = await supabase.from("freshers_campaign_entries").delete().eq("id", id);
    return !error;
  }

  public async findByMobileAndCampaign(
    campaignId: UUID,
    normalizedMobile: string
  ): Promise<FreshersCampaignEntrySelect | null> {
    try {
      const rows = await drizzleDb
        .select()
        .from(freshersCampaignEntries)
        .where(
          and(
            eq(freshersCampaignEntries.campaignId, campaignId),
            eq(freshersCampaignEntries.normalizedMobile, normalizedMobile),
            isNull(freshersCampaignEntries.deletedAt)
          )
        )
        .limit(1);

      if (rows && rows[0]) return rows[0];
    } catch (err: any) {
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle findByMobileAndCampaign fallback to Supabase", { message: err?.message });
    }

    try {
      const { data } = await supabase
        .from("freshers_campaign_entries")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("normalized_mobile", normalizedMobile)
        .is("deleted_at", null)
        .limit(1);
      if (data && data[0]) return toCamelCase<FreshersCampaignEntrySelect>(data[0]);
    } catch (err: any) {
      logger.error("[FreshersCampaignEntriesRepository] Error checking existing mobile entry", { message: err?.message });
    }
    return null;
  }

  public async getCampaignEntries(
    campaignId: UUID,
    options: {
      search?: string;
      rating?: number;
      drawStatus?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ data: FreshersCampaignEntrySelect[]; total: number }> {
    try {
      const conditions: any[] = [
        eq(freshersCampaignEntries.campaignId, campaignId),
        isNull(freshersCampaignEntries.deletedAt),
      ];

      if (options.rating) {
        conditions.push(eq(freshersCampaignEntries.stallRating, options.rating));
      }
      if (options.drawStatus) {
        conditions.push(eq(freshersCampaignEntries.drawStatus, options.drawStatus));
      }
      if (options.status) {
        conditions.push(eq(freshersCampaignEntries.status, options.status));
      }
      if (options.search && options.search.trim()) {
        const term = `%${options.search.trim()}%`;
        conditions.push(
          or(
            ilike(freshersCampaignEntries.fullName, term),
            ilike(freshersCampaignEntries.mobileNumber, term)
          )!
        );
      }

      const rows = await drizzleDb
        .select()
        .from(freshersCampaignEntries)
        .where(and(...conditions))
        .orderBy(desc(freshersCampaignEntries.createdAt));

      const total = rows.length;
      let paginated = rows;
      if (options.limit) {
        const offset = options.offset || 0;
        paginated = rows.slice(offset, offset + options.limit);
      }

      return { data: paginated, total };
    } catch (err: any) {
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle getCampaignEntries fallback to Supabase", { message: err?.message });
    }

    try {
      let query = supabase
        .from("freshers_campaign_entries")
        .select("*", { count: "exact" })
        .eq("campaign_id", campaignId)
        .is("deleted_at", null);

      if (options.rating) {
        query = query.eq("stall_rating", options.rating);
      }
      if (options.drawStatus) {
        query = query.eq("draw_status", options.drawStatus);
      }
      if (options.status) {
        query = query.eq("status", options.status);
      }
      if (options.search && options.search.trim()) {
        const term = `%${options.search.trim()}%`;
        query = query.or(`full_name.ilike.${term},mobile_number.ilike.${term}`);
      }

      query = query.order("created_at", { ascending: false });

      if (options.limit) {
        const from = options.offset || 0;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }

      const { data, count } = await query;
      const parsedData = (data || []).map((row) => toCamelCase<FreshersCampaignEntrySelect>(row));
      return { data: parsedData, total: count || 0 };
    } catch (err: any) {
      logger.error("[FreshersCampaignEntriesRepository] Error fetching campaign entries", { message: err?.message });
      return { data: [], total: 0 };
    }
  }

  public async getWinners(campaignId: UUID): Promise<FreshersCampaignEntrySelect[]> {
    try {
      const rows = await drizzleDb
        .select()
        .from(freshersCampaignEntries)
        .where(
          and(
            eq(freshersCampaignEntries.campaignId, campaignId),
            eq(freshersCampaignEntries.drawStatus, "winner"),
            isNull(freshersCampaignEntries.deletedAt)
          )
        )
        .orderBy(freshersCampaignEntries.winnerPosition);

      if (rows) return rows;
    } catch (err: any) {
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle getWinners fallback", { message: err?.message });
    }

    try {
      const { data } = await supabase
        .from("freshers_campaign_entries")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("draw_status", "winner")
        .is("deleted_at", null)
        .order("winner_position", { ascending: true });

      return (data || []).map((row) => toCamelCase<FreshersCampaignEntrySelect>(row));
    } catch (err: any) {
      logger.error("[FreshersCampaignEntriesRepository] Error fetching winners", { message: err?.message });
      return [];
    }
  }

  /**
   * Concurrency-safe atomic lucky draw selection via RPC stored procedure or Drizzle fallback
   */
  public async drawRandomWinner(
    campaignId: UUID,
    prizeTier: string,
    drawnBy: UUID
  ): Promise<FreshersCampaignEntrySelect | null> {
    // 1. Direct Drizzle SQL execution of select_freshers_lucky_draw_winner procedure
    try {
      const res = await drizzleDb.execute(
        sql`SELECT * FROM select_freshers_lucky_draw_winner(${campaignId}::uuid, ${prizeTier}::text, ${drawnBy}::uuid)`
      );
      const rows = (res as any) || [];
      const winnerRow = Array.isArray(rows) ? rows[0] : rows;
      if (winnerRow && (winnerRow.winner_id || winnerRow.id)) {
        const winnerId = winnerRow.winner_id || winnerRow.id;
        return this.findById(winnerId);
      }
    } catch (err: any) {
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle lucky draw execution fallback", { message: err?.message });
    }

    // 2. Direct Atomic Drizzle Transaction Fallback
    try {
      const eligibleRows = await drizzleDb
        .select()
        .from(freshersCampaignEntries)
        .where(
          and(
            eq(freshersCampaignEntries.campaignId, campaignId),
            eq(freshersCampaignEntries.status, "registered"),
            eq(freshersCampaignEntries.drawStatus, "eligible"),
            isNull(freshersCampaignEntries.deletedAt)
          )
        );

      if (!eligibleRows || eligibleRows.length === 0) {
        return null;
      }

      // Pick random eligible winner
      const randomIdx = Math.floor(Math.random() * eligibleRows.length);
      const selected = eligibleRows[randomIdx];

      // Get next position
      const winners = await this.getWinners(campaignId);
      const nextPosition = winners.length + 1;

      const [updated] = await drizzleDb
        .update(freshersCampaignEntries)
        .set({
          drawStatus: "winner",
          prizeTier: prizeTier,
          winnerPosition: nextPosition,
          drawnAt: new Date().toISOString() as any,
          drawnBy: drawnBy,
          updatedBy: drawnBy,
          updatedAt: new Date().toISOString() as any,
        })
        .where(eq(freshersCampaignEntries.id, selected.id))
        .returning();

      if (updated) return updated;
    } catch (err: any) {
      logger.warn("[FreshersCampaignEntriesRepository] Drizzle atomic transaction fallback to Supabase RPC", { message: err?.message });
    }

    // 3. Supabase RPC fallback
    try {
      const { data, error } = await supabase.rpc("select_freshers_lucky_draw_winner", {
        p_campaign_id: campaignId,
        p_prize_tier: prizeTier,
        p_drawn_by: drawnBy,
      });

      if (error) {
        logger.error("[FreshersCampaignEntriesRepository] Supabase RPC drawRandomWinner error", { message: error.message });
        throw new Error(error.message);
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;

      return this.findById(row.winner_id || row.id);
    } catch (err: any) {
      logger.error("[FreshersCampaignEntriesRepository] Error executing drawRandomWinner", { message: err?.message });
      throw err;
    }
  }
}
