/**
 * Freshers Domain - Freshers Campaign Service Implementation
 */

import { FreshersCampaignsRepository } from "@/repositories/freshers/freshers_campaigns.repository";
import { FreshersCampaignEntriesRepository } from "@/repositories/freshers/freshers_campaign_entries.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { MembersService } from "@/services/members/members.service";
import { FreshersCampaignSelect, FreshersCampaignEntrySelect } from "@/db/schema";
import { UUID } from "@/core/types";
import { logger } from "@/core/logger";

export type PublicEntryResult =
  | {
      success: true;
      status: "registered";
      message: string;
      id?: string;
    }
  | {
      success: false;
      status: "already_registered";
      message: string;
    }
  | {
      success: false;
      status: "campaign_unavailable";
      message: string;
    }
  | {
      success: false;
      status: "error";
      message: string;
    };

export class FreshersCampaignService {
  private campaignsRepo: FreshersCampaignsRepository;
  private entriesRepo: FreshersCampaignEntriesRepository;
  private membersRepo: MembersRepository;
  private membersService: MembersService;

  constructor() {
    this.campaignsRepo = new FreshersCampaignsRepository();
    this.entriesRepo = new FreshersCampaignEntriesRepository();
    this.membersRepo = new MembersRepository();
    this.membersService = new MembersService(this.membersRepo);
  }

  /**
   * Normalizes an Indian mobile number to a canonical 10-digit format
   */
  public normalizeMobile(mobile: string): string {
    if (!mobile) return "";
    let digits = mobile.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
      digits = digits.substring(2);
    } else if (digits.length === 11 && digits.startsWith("0")) {
      digits = digits.substring(1);
    }
    return digits;
  }

  /**
   * Returns safe public metadata for active freshers campaign
   */
  public async getActiveCampaignPublic(): Promise<{
    id: string;
    campaignKey: string;
    title: string;
    description: string;
    status: string;
  } | null> {
    const active = await this.campaignsRepo.findActiveCampaign();
    if (!active || active.status !== "active") return null;

    const now = new Date();
    if (active.startDate && new Date(active.startDate) > now) return null;
    if (active.endDate && new Date(active.endDate) < now) return null;

    // Explicitly expose ONLY safe public fields
    return {
      id: active.id,
      campaignKey: active.campaignKey,
      title: active.title,
      description: active.description || "SVCE Robotics Club Freshers Recruitment & Lucky Draw",
      status: active.status,
    };
  }

  /**
   * Handles public submission of freshers campaign entries
   */
  public async submitPublicEntry(input: {
    fullName: string;
    mobileNumber: string;
    stallRating: number;
    feedback?: string;
  }): Promise<PublicEntryResult> {
    const activeCampaign = await this.campaignsRepo.findActiveCampaign();
    if (!activeCampaign || activeCampaign.status !== "active") {
      return {
        success: false,
        status: "campaign_unavailable",
        message: "Registration is currently unavailable.",
      };
    }

    const now = new Date();
    if (
      (activeCampaign.startDate && new Date(activeCampaign.startDate) > now) ||
      (activeCampaign.endDate && new Date(activeCampaign.endDate) < now)
    ) {
      return {
        success: false,
        status: "campaign_unavailable",
        message: "Registration is currently unavailable.",
      };
    }

    const name = (input.fullName || "").trim();
    if (!name || name.length < 2) {
      return {
        success: false,
        status: "error",
        message: "Please enter a valid full name.",
      };
    }

    const normalized = this.normalizeMobile(input.mobileNumber);
    if (!normalized || normalized.length !== 10) {
      return {
        success: false,
        status: "error",
        message: "Please enter a valid 10-digit mobile number.",
      };
    }

    const rating = Number(input.stallRating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return {
        success: false,
        status: "error",
        message: "Please select a rating between 1 and 5 stars.",
      };
    }

    // 1. Authoritative Server-side Duplicate Check via Database Lookup
    const existing = await this.entriesRepo.findByMobileAndCampaign(activeCampaign.id, normalized);
    if (existing) {
      logger.info("[FreshersCampaignService] Duplicate submission detected via mobile lookup", {
        campaignId: activeCampaign.id,
      });
      return {
        success: false,
        status: "already_registered",
        message: "You're already registered for this Freshers Campaign.",
      };
    }

    // 2. Attempt Controlled Database Insert
    try {
      const publicActor = "00000000-0000-0000-0000-000000000000" as UUID;
      const created = await this.entriesRepo.create(
        {
          campaignId: activeCampaign.id,
          fullName: name,
          mobileNumber: input.mobileNumber.trim(),
          normalizedMobile: normalized,
          stallRating: rating,
          feedback: (input.feedback || "").trim() || null,
          status: "registered",
          drawStatus: "eligible",
          prizeTier: null,
          winnerPosition: null,
          drawnAt: null,
          drawnBy: null,
          createdBy: publicActor,
          updatedBy: publicActor,
        },
        publicActor // Public system actor
      );

      logger.info("[FreshersCampaignService] Successfully recorded campaign entry", {
        entryId: created.id,
        campaignId: activeCampaign.id,
      });

      return {
        success: true,
        status: "registered",
        message: "Registration Successful! Congratulations, your entry for the Robotics Club Freshers Campaign has been recorded successfully.",
        id: created.id,
      };
    } catch (err: any) {
      // 3. PostgreSQL Unique Constraint Safety Net (Race condition protection)
      if (
        err.message?.includes("freshers_campaign_entries_campaign_mobile_uq") ||
        err.code === "23505"
      ) {
        logger.info("[FreshersCampaignService] Unique constraint violation caught during insertion", {
          campaignId: activeCampaign.id,
        });
        return {
          success: false,
          status: "already_registered",
          message: "You're already registered for this Freshers Campaign.",
        };
      }

      logger.error("[FreshersCampaignService] Unexpected error inserting campaign entry", err);
      return {
        success: false,
        status: "error",
        message: "We couldn't complete your registration. Please try again.",
      };
    }
  }

  /**
   * Admin: Get all freshers campaign dashboard data
   */
  public async getAdminDashboardData(options: {
    search?: string;
    rating?: number;
    drawStatus?: string;
    status?: string;
  } = {}) {
    const activeCampaign = await this.campaignsRepo.findActiveCampaign();
    if (!activeCampaign) {
      return {
        activeCampaign: null,
        stats: { totalEntries: 0, todaysEntries: 0, avgRating: 0, eligibleEntries: 0, winnersSelected: 0 },
        entries: [],
        total: 0,
        winners: [],
      };
    }

    const { data: entries, total } = await this.entriesRepo.getCampaignEntries(activeCampaign.id, options);
    const winners = await this.entriesRepo.getWinners(activeCampaign.id);

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysEntries = entries.filter((e) => new Date(e.createdAt) >= today).length;
    const totalRating = entries.reduce((acc, curr) => acc + curr.stallRating, 0);
    const avgRating = total > 0 ? Number((totalRating / total).toFixed(1)) : 0;
    const eligibleEntries = entries.filter((e) => e.drawStatus === "eligible" && e.status === "registered").length;

    return {
      activeCampaign,
      stats: {
        totalEntries: total,
        todaysEntries,
        avgRating,
        eligibleEntries,
        winnersSelected: winners.length,
      },
      entries,
      total,
      winners,
    };
  }

  /**
   * Admin: Update campaign status (draft, active, closed)
   */
  public async updateCampaignStatus(campaignId: UUID, status: "draft" | "active" | "closed", actorId: UUID) {
    return this.campaignsRepo.update(campaignId, { status }, actorId);
  }

  /**
   * Admin: Execute lucky draw to randomly pick an eligible winner (Concurrency-Safe)
   */
  public async executeLuckyDraw(prizeTier: string, actorId: UUID): Promise<FreshersCampaignEntrySelect> {
    const activeCampaign = await this.campaignsRepo.findActiveCampaign();
    if (!activeCampaign) {
      throw new Error("No active campaign found to execute lucky draw.");
    }

    const winner = await this.entriesRepo.drawRandomWinner(activeCampaign.id, prizeTier, actorId);
    if (!winner) {
      throw new Error("No eligible entries available for lucky draw.");
    }

    return winner;
  }

  /**
   * Admin: Convert a campaign entry into an official RCMS Member
   */
  public async convertEntryToMember(entryId: UUID, actorId: UUID) {
    const entry = await this.entriesRepo.findById(entryId);
    if (!entry) {
      return { success: false, message: "Campaign entry not found." };
    }

    if (entry.status === "converted") {
      return { success: false, message: "This entry has already been converted to an official member." };
    }

    // Register via authoritative MembersService workflow
    const member = await this.membersService.registerMember(
      {
        fullName: entry.fullName,
        mobileNumber: entry.mobileNumber,
        yearOfStudy: 1, // Freshers 1st Year default
        department: "General Robotics",
        joinDate: new Date().toISOString(),
      },
      actorId
    );

    // Update campaign entry status to converted
    await this.entriesRepo.update(entry.id, { status: "converted" }, actorId);

    return { success: true, memberId: member.id, message: "Successfully converted entry to official member!" };
  }
}
