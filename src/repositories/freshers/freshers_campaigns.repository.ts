/**
 * Freshers Domain - Freshers Campaigns Repository
 */

import { db, supabase, toCamelCase, toSnakeCase } from "@/db";
import { FreshersCampaignSelect, FreshersCampaignInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class FreshersCampaignsRepository extends BaseRepository<
  FreshersCampaignSelect,
  FreshersCampaignInsert,
  Partial<FreshersCampaignInsert>
> {
  protected getTableName(): string {
    return "freshers_campaigns";
  }

  public async findById(id: UUID, options?: { includeDeleted?: boolean }): Promise<FreshersCampaignSelect | null> {
    try {
      let query = supabase.from("freshers_campaigns").select("*").eq("id", id);
      if (!options?.includeDeleted) {
        query = query.is("deleted_at", null);
      }
      const { data } = await query.limit(1);
      if (data && data[0]) return toCamelCase<FreshersCampaignSelect>(data[0]);
    } catch (err) {
      logger.error("[FreshersCampaignsRepository] findById error", err);
    }
    return null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<FreshersCampaignSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      let req = supabase
        .from("freshers_campaigns")
        .select("*", { count: "exact" })
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data, count } = await req;
      const parsedData = (data || []).map((row) => toCamelCase<FreshersCampaignSelect>(row));
      const total = count || 0;

      return {
        items: parsedData,
        total,
        page,
        limit,
        totalPages: this.calculateTotalPages(total, limit),
      };
    } catch (err) {
      logger.error("[FreshersCampaignsRepository] findAll error", err);
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }
  }

  public async create(data: FreshersCampaignInsert, creatorId: UUID): Promise<FreshersCampaignSelect> {
    const payload = toSnakeCase({
      ...data,

      created_by: creatorId,
      updated_by: creatorId,
    });

    const { data: result, error } = await supabase
      .from("freshers_campaigns")
      .insert(payload)
      .select("*")
      .single();

    if (error || !result) {
      logger.error("[FreshersCampaignsRepository] create error", error);
      throw new Error(error?.message || "Failed to create campaign record.");
    }

    return toCamelCase<FreshersCampaignSelect>(result);
  }

  public async update(
    id: UUID,
    data: Partial<FreshersCampaignInsert>,
    updaterId: UUID
  ): Promise<FreshersCampaignSelect> {
    const payload = toSnakeCase({
      ...data,

      updated_by: updaterId,
      updated_at: new Date().toISOString(),
    });

    const { data: result, error } = await supabase
      .from("freshers_campaigns")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !result) {
      logger.error("[FreshersCampaignsRepository] update error", error);
      throw new Error(error?.message || "Failed to update campaign record.");
    }

    return toCamelCase<FreshersCampaignSelect>(result);
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const { error } = await supabase
      .from("freshers_campaigns")
      .update({ deleted_at: new Date().toISOString(), updated_by: deleterId })
      .eq("id", id);
    return !error;
  }

  public async purge(id: UUID): Promise<boolean> {
    const { error } = await supabase.from("freshers_campaigns").delete().eq("id", id);
    return !error;
  }

  public async findActiveCampaign(): Promise<FreshersCampaignSelect | null> {
    try {
      const { data } = await supabase
        .from("freshers_campaigns")
        .select("*")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data[0]) return toCamelCase<FreshersCampaignSelect>(data[0]);
    } catch (err) {
      logger.error("[FreshersCampaignsRepository] Error fetching active campaign", err);
    }
    return null;
  }

  public async findByKey(campaignKey: string): Promise<FreshersCampaignSelect | null> {
    try {
      const { data } = await supabase
        .from("freshers_campaigns")
        .select("*")
        .eq("campaign_key", campaignKey)
        .is("deleted_at", null)
        .limit(1);
      if (data && data[0]) return toCamelCase<FreshersCampaignSelect>(data[0]);
    } catch (err) {
      logger.error("[FreshersCampaignsRepository] Error fetching campaign by key", err);
    }
    return null;
  }
}
