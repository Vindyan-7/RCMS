/**
 * Freshers Domain - Freshers Campaign Entries Repository
 */

import { supabase, toCamelCase, toSnakeCase } from "@/db";
import { FreshersCampaignEntrySelect, FreshersCampaignEntryInsert } from "@/db/schema";
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
      let query = supabase.from("freshers_campaign_entries").select("*").eq("id", id);
      if (!options?.includeDeleted) {
        query = query.is("deleted_at", null);
      }
      const { data } = await query.limit(1);
      if (data && data[0]) return toCamelCase<FreshersCampaignEntrySelect>(data[0]);
    } catch (err) {
      logger.error("[FreshersCampaignEntriesRepository] findById error", err);
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
    const to = from + limit - 1;

    try {
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
    } catch (err) {
      logger.error("[FreshersCampaignEntriesRepository] findAll error", err);
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }
  }

  public async create(data: FreshersCampaignEntryInsert, creatorId: UUID): Promise<FreshersCampaignEntrySelect> {
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
      logger.error("[FreshersCampaignEntriesRepository] create error", error);
      throw new Error(error?.message || "Failed to create campaign entry record.");
    }

    return toCamelCase<FreshersCampaignEntrySelect>(result);
  }

  public async update(
    id: UUID,
    data: Partial<FreshersCampaignEntryInsert>,
    updaterId: UUID
  ): Promise<FreshersCampaignEntrySelect> {
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
      logger.error("[FreshersCampaignEntriesRepository] update error", error);
      throw new Error(error?.message || "Failed to update campaign entry record.");
    }

    return toCamelCase<FreshersCampaignEntrySelect>(result);
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const { error } = await supabase
      .from("freshers_campaign_entries")
      .update({ deleted_at: new Date().toISOString(), updated_by: deleterId })
      .eq("id", id);
    return !error;
  }

  public async purge(id: UUID): Promise<boolean> {
    const { error } = await supabase.from("freshers_campaign_entries").delete().eq("id", id);
    return !error;
  }

  public async findByMobileAndCampaign(
    campaignId: UUID,
    normalizedMobile: string
  ): Promise<FreshersCampaignEntrySelect | null> {
    try {
      const { data } = await supabase
        .from("freshers_campaign_entries")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("normalized_mobile", normalizedMobile)
        .is("deleted_at", null)
        .limit(1);
      if (data && data[0]) return toCamelCase<FreshersCampaignEntrySelect>(data[0]);
    } catch (err) {
      logger.error("[FreshersCampaignEntriesRepository] Error checking existing mobile entry", err);
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
      if (options.search) {
        const term = `%${options.search}%`;
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
    } catch (err) {
      logger.error("[FreshersCampaignEntriesRepository] Error fetching campaign entries", err);
      return { data: [], total: 0 };
    }
  }

  public async getWinners(campaignId: UUID): Promise<FreshersCampaignEntrySelect[]> {
    try {
      const { data } = await supabase
        .from("freshers_campaign_entries")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("draw_status", "winner")
        .is("deleted_at", null)
        .order("winner_position", { ascending: true });

      return (data || []).map((row) => toCamelCase<FreshersCampaignEntrySelect>(row));
    } catch (err) {
      logger.error("[FreshersCampaignEntriesRepository] Error fetching winners", err);
      return [];
    }
  }

  /**
   * Concurrency-safe atomic lucky draw selection via RPC stored procedure select_freshers_lucky_draw_winner
   */
  public async drawRandomWinner(
    campaignId: UUID,
    prizeTier: string,
    drawnBy: UUID
  ): Promise<FreshersCampaignEntrySelect | null> {
    try {
      const { data, error } = await supabase.rpc("select_freshers_lucky_draw_winner", {
        p_campaign_id: campaignId,
        p_prize_tier: prizeTier,
        p_drawn_by: drawnBy,
      });

      if (error) {
        logger.error("[FreshersCampaignEntriesRepository] RPC drawRandomWinner error", error);
        throw new Error(error.message);
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;

      // Fetch complete updated entry record
      return this.findById(row.winner_id || row.id);
    } catch (err) {
      logger.error("[FreshersCampaignEntriesRepository] Error executing drawRandomWinner", err);
      throw err;
    }
  }
}
