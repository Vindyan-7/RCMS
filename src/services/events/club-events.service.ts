/**
 * Events Domain - Club Events Service
 * Central domain service governing business rules for competitions, submissions, voting & results.
 * Hardened for cross-identity bypass prevention, configurable multi-vote limits, and race conditions.
 */

import {
  EventParticipantsRepository,
  EventSubmissionsRepository,
  EventSubmissionImagesRepository,
  EventVotesRepository,
} from "@/repositories/events";
import { EventsRepository } from "@/repositories/operations/events.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { PointsLedgerRepository } from "@/repositories/points/points_ledger.repository";
import {
  EventSelect,
  EventParticipantSelect,
  EventSubmissionSelect,
  EventSubmissionImageSelect,
  EventVoteSelect,
  events,
  auditLogs,
  pointsLedger,
} from "@/db/schema";
import { db, supabase } from "@/db";
import { eq, and } from "drizzle-orm";
import { UUID } from "@/core/types";
import { BadRequestError, NotFoundError, ConflictError } from "@/core/errors";
import { logger } from "@/core/logger";

export interface PublicMemberProfile {
  id: string;
  memberId: string;
  name: string;
  rollNumber: string;
  branch: string | null;
  year: number | null;
  clubMembershipId: string | null;
}

export interface SubmissionWithImages extends EventSubmissionSelect {
  images: EventSubmissionImageSelect[];
  participantName?: string;
  voteCount?: number;
}

export interface EventRankingItem {
  rank: number;
  submissionId: string;
  title: string;
  participantName: string;
  voteCount: number;
  winnerRank: number | null;
  submissionCreatedAt: Date;
  images: EventSubmissionImageSelect[];
}

export class ClubEventsService {
  constructor(
    private readonly eventsRepo: EventsRepository = new EventsRepository(),
    private readonly participantsRepo: EventParticipantsRepository = new EventParticipantsRepository(),
    private readonly submissionsRepo: EventSubmissionsRepository = new EventSubmissionsRepository(),
    private readonly submissionImagesRepo: EventSubmissionImagesRepository = new EventSubmissionImagesRepository(),
    private readonly votesRepo: EventVotesRepository = new EventVotesRepository(),
    private readonly membersRepo: MembersRepository = new MembersRepository(),
    private readonly pointsLedgerRepo: PointsLedgerRepository = new PointsLedgerRepository()
  ) {}

  /**
   * Helper: Calculates voting points from submission points and voting percentage (integer rounded)
   */
  public calculateVotingPoints(submissionPoints: number, votingPercentage: number): number {
    return Math.round((submissionPoints * votingPercentage) / 100);
  }

  /**
   * Helper: Normalizes a 10-digit Indian phone number server-side
   */
  public normalizeMobile(raw: string): string {
    if (!raw) return "";
    let digits = raw.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
      digits = digits.substring(2);
    } else if (digits.length === 11 && digits.startsWith("0")) {
      digits = digits.substring(1);
    }
    return digits;
  }

  /**
   * Helper: Log audit actions
   */
  private async logAudit(userId: UUID, action: string, details: Record<string, any>) {
    try {
      await db.insert(auditLogs).values({
        userId,
        module: "club_events",
        action,
        newValue: details,
      });
    } catch (err) {
      logger.error("[ClubEventsService] Audit log error", err);
    }
  }

  /**
   * Helper: Find official member by normalized phone
   * Used for Cross-Identity Bypass Prevention
   */
  public async findMemberByNormalizedPhone(normalized: string): Promise<any | null> {
    if (!normalized || normalized.length !== 10) return null;
    try {
      const { data } = await supabase
        .from("members")
        .select("id, member_id, name, roll_number, phone, status")
        .ilike("phone", `%${normalized}%`)
        .is("deleted_at", null)
        .limit(1);

      if (data && data[0]) return data[0];
    } catch (err) {
      logger.error("[ClubEventsService] findMemberByNormalizedPhone error", err);
    }
    return null;
  }

  // ==========================================================================
  // 1. PARTICIPANT REGISTRATION & LOOKUP
  // ==========================================================================

  /**
   * Resolves an official member using SAC Membership ID, Roll Number, or Member ID
   * Returns safe public metadata without exposing private credentials.
   */
  public async resolveMemberForEvent(
    eventId: UUID,
    query: string
  ): Promise<PublicMemberProfile> {
    const cleanQuery = (query || "").trim();
    if (!cleanQuery) {
      throw new BadRequestError("Please provide a valid SAC Membership ID or Roll Number.");
    }

    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) {
      throw new NotFoundError("Competition event not found.");
    }

    // Try finding member by SAC Club Membership ID, Roll Number, or Member ID
    let foundMember = null;
    try {
      const { data } = await supabase
        .from("members")
        .select("id, member_id, name, roll_number, branch, year, club_membership_id, status")
        .or(
          `club_membership_id.ilike.${cleanQuery},roll_number.ilike.${cleanQuery},member_id.ilike.${cleanQuery}`
        )
        .is("deleted_at", null)
        .limit(1);

      if (data && data[0]) {
        foundMember = data[0];
      }
    } catch (err) {
      logger.error("[ClubEventsService] Member lookup error", err);
    }

    if (!foundMember) {
      throw new NotFoundError(
        `Membership ID or Roll Number "${cleanQuery}" was not found in the club registry.`
      );
    }

    if (foundMember.status !== "active") {
      throw new BadRequestError("This member membership is currently inactive.");
    }

    return {
      id: foundMember.id,
      memberId: foundMember.member_id,
      name: foundMember.name,
      rollNumber: foundMember.roll_number,
      branch: foundMember.branch,
      year: foundMember.year,
      clubMembershipId: foundMember.club_membership_id,
    };
  }

  /**
   * Registers an official Robotics Club Member for an event
   * Hardened against Cross-Identity Bypass:
   * - Sets normalizedMobile from member profile so DB unique constraint protects it
   * - Upgrades/links any existing fresher participant registered with the same phone
   */
  public async registerMemberParticipant(
    eventId: UUID,
    memberId: UUID
  ): Promise<EventParticipantSelect> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) {
      throw new NotFoundError("Competition event not found.");
    }

    if (event.status === "cancelled" || event.status === "archived") {
      throw new BadRequestError("Event is not accepting participants.");
    }

    const member = await this.membersRepo.findById(memberId);
    if (!member) {
      throw new NotFoundError("Member record not found.");
    }

    const normalizedPhone = this.normalizeMobile(member.phone);

    // 1. Check if participant record already exists for this memberId
    const existingByMember = await this.participantsRepo.findByEventAndMemberId(eventId, memberId);
    if (existingByMember) {
      if (!existingByMember.normalizedMobile && normalizedPhone) {
        await this.participantsRepo.update(existingByMember.id, {
          normalizedMobile: normalizedPhone,
          mobileNumber: member.phone,
        });
        existingByMember.normalizedMobile = normalizedPhone;
        existingByMember.mobileNumber = member.phone;
      }
      return existingByMember;
    }

    // 2. Check if this person previously registered as a fresher using their phone
    if (normalizedPhone) {
      const existingByPhone = await this.participantsRepo.findByEventAndNormalizedMobile(
        eventId,
        normalizedPhone
      );
      if (existingByPhone) {
        logger.info("[ClubEventsService] Upgrading existing fresher participant to canonical member identity", {
          eventId,
          participantId: existingByPhone.id,
          memberId: member.id,
        });
        const upgraded = await this.participantsRepo.update(existingByPhone.id, {
          participantType: "member",
          memberId: member.id,
          fresherName: null,
          mobileNumber: member.phone,
          normalizedMobile: normalizedPhone,
        });
        return upgraded;
      }
    }

    // 3. Create fresh canonical member participant record
    try {
      return await this.participantsRepo.create({
        eventId,
        participantType: "member",
        memberId,
        mobileNumber: member.phone,
        normalizedMobile: normalizedPhone || null,
      });
    } catch (err: any) {
      // Graceful fallback on race condition / unique constraint conflict
      const retry =
        (await this.participantsRepo.findByEventAndMemberId(eventId, memberId)) ||
        (normalizedPhone
          ? await this.participantsRepo.findByEventAndNormalizedMobile(eventId, normalizedPhone)
          : null);
      if (retry) return retry;
      throw err;
    }
  }

  /**
   * Registers a Fresher / Non-Member participant for an event
   * Hardened against Cross-Identity Bypass:
   * - If the mobile belongs to an official club member, automatically binds to the canonical member identity!
   * - Normalizes mobile server-side and checks uq_event_participants_fresher
   */
  public async registerFresherParticipant(
    eventId: UUID,
    fullName: string,
    mobileNumber: string
  ): Promise<EventParticipantSelect> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) {
      throw new NotFoundError("Competition event not found.");
    }

    if (event.status === "cancelled" || event.status === "archived") {
      throw new BadRequestError("Event is not accepting participants.");
    }

    const cleanName = (fullName || "").trim();
    if (cleanName.length < 2) {
      throw new BadRequestError("Full Name must be at least 2 characters.");
    }

    const normalized = this.normalizeMobile(mobileNumber);
    if (!normalized || normalized.length !== 10) {
      throw new BadRequestError("Please enter a valid 10-digit mobile number.");
    }

    // 1. Cross-Identity Prevention: Check if this phone belongs to an official registered club member!
    const memberMatch = await this.findMemberByNormalizedPhone(normalized);
    if (memberMatch) {
      logger.info("[ClubEventsService] Fresher registration phone matches official member, resolving to canonical member identity", {
        eventId,
        normalized,
        memberId: memberMatch.id,
      });
      // Canonical Rule: Always resolve to official member identity
      return this.registerMemberParticipant(eventId, memberMatch.id as UUID);
    }

    // 2. Check if fresher already registered
    const existing = await this.participantsRepo.findByEventAndNormalizedMobile(
      eventId,
      normalized
    );
    if (existing) {
      logger.info("[ClubEventsService] Fresher already registered, returning existing participant", {
        eventId,
        normalized,
        participantId: existing.id,
      });
      return existing;
    }

    try {
      return await this.participantsRepo.create({
        eventId,
        participantType: "fresher",
        fresherName: cleanName,
        mobileNumber: mobileNumber.trim(),
        normalizedMobile: normalized,
      });
    } catch (err: any) {
      // Graceful fallback on race condition / unique constraint conflict
      const retry = await this.participantsRepo.findByEventAndNormalizedMobile(eventId, normalized);
      if (retry) return retry;
      throw err;
    }
  }

  // ==========================================================================
  // 2. PROJECT SUBMISSIONS
  // ==========================================================================

  /**
   * Submits a project with image metadata
   */
  public async submitProject(
    eventId: UUID,
    participantId: UUID,
    input: {
      title: string;
      description: string;
      images: Array<{
        imageUrl: string;
        storagePath: string;
        fileSizeBytes?: number;
        mimeType?: string;
        displayOrder?: number;
      }>;
    }
  ): Promise<SubmissionWithImages> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) {
      throw new NotFoundError("Competition event not found.");
    }

    const participant = await this.participantsRepo.findById(participantId);
    if (!participant || participant.eventId !== eventId) {
      throw new BadRequestError("Participant is not registered for this event.");
    }

    // Verify submission window
    const now = new Date();
    if (event.submissionStartAt && now < new Date(event.submissionStartAt)) {
      throw new BadRequestError("Project submission window has not opened yet.");
    }
    if (event.submissionEndAt && now > new Date(event.submissionEndAt)) {
      throw new BadRequestError("Project submission window has closed.");
    }

    // Check existing submission (one submission per participant)
    const existing = await this.submissionsRepo.findByEventAndParticipant(
      eventId,
      participantId
    );
    if (existing) {
      throw new ConflictError("You have already submitted a project for this event.");
    }

    // Validation: Description minimum length
    const cleanDesc = (input.description || "").trim();
    const minChars = event.minDescriptionChars ?? 100;
    if (cleanDesc.length < minChars) {
      throw new BadRequestError(
        `Your submission does not meet the minimum description requirement (${cleanDesc.length}/${minChars} characters).`
      );
    }

    // Validation: Image count constraints
    const images = input.images || [];
    const minImgs = event.minImages ?? 1;
    const maxImgs = event.maxImages ?? 2;
    if (images.length < minImgs) {
      throw new BadRequestError(`You must upload at least ${minImgs} image.`);
    }
    if (images.length > maxImgs) {
      throw new BadRequestError(`You can upload a maximum of ${maxImgs} images.`);
    }

    // 1. Create submission record (starts as submitted)
    const submission = await this.submissionsRepo.create({
      eventId,
      participantId,
      title: input.title.trim(),
      description: cleanDesc,
      status: "submitted",
    });

    // 2. Attach images
    const imageInserts = images.map((img, idx) => ({
      submissionId: submission.id,
      imageUrl: img.imageUrl,
      storagePath: img.storagePath,
      fileSizeBytes: img.fileSizeBytes || null,
      mimeType: img.mimeType || "image/jpeg",
      displayOrder: img.displayOrder !== undefined ? img.displayOrder : idx,
    }));

    const savedImages = await this.submissionImagesRepo.createMany(imageInserts);

    // 3. Award submission points to official club member (100% idempotent)
    if (participant.participantType === "member" && participant.memberId) {
      try {
        const member = await this.membersRepo.findById(participant.memberId);
        if (member && member.status === "active") {
          const subPoints = event.submissionPoints ?? 100;
          if (subPoints > 0) {
            const existingEntries = await this.pointsLedgerRepo.findByMemberAndReference(
              participant.memberId,
              submission.id
            );
            const activeEntry = existingEntries.find((e: any) => !e.isRevoked);
            if (!activeEntry) {
              const { data: semData } = await supabase
                .from("semesters")
                .select("id")
                .eq("status", "active")
                .limit(1)
                .single();

              await this.pointsLedgerRepo.create({
                memberId: participant.memberId,
                category: "event",
                referenceType: "event_submissions",
                referenceId: submission.id,
                semesterId: semData?.id || null,
                points: subPoints,
                createdBy: "00000000-0000-0000-0000-000000000001",
                remarks: `Event submission points for "${event.name}"`,
              });
              logger.info("[ClubEventsService] Awarded event submission points", {
                eventId,
                memberId: participant.memberId,
                submissionId: submission.id,
                points: subPoints,
              });
            }
          }
        }
      } catch (err) {
        logger.error("[ClubEventsService] Failed to award submission points", err);
      }
    }

    return {
      ...submission,
      images: savedImages,
    };
  }

  /**
   * Retrieves published submissions for the public gallery
   */
  public async getPublishedSubmissions(
    eventId: UUID
  ): Promise<SubmissionWithImages[]> {
    const subs = await this.submissionsRepo.findPublishedByEvent(eventId);
    if (subs.length === 0) return [];

    const subIds = subs.map((s) => s.id);
    const imagesMap = await this.submissionImagesRepo.findBySubmissionIds(subIds);

    // Fetch participant names cleanly without exposing private data
    const participantIds = subs.map((s) => s.participantId);
    const partMap: Record<string, string> = {};

    try {
      const { data: parts } = await supabase
        .from("event_participants")
        .select("id, participant_type, fresher_name, members(name)")
        .in("id", participantIds);

      if (parts) {
        for (const p of parts) {
          if (p.participant_type === "member" && p.members) {
            partMap[p.id] = (p.members as any).name || "Club Member";
          } else {
            partMap[p.id] = p.fresher_name || "Participant";
          }
        }
      }
    } catch {}

    const voteCounts = await this.votesRepo.getSubmissionVoteCounts(eventId);

    return subs.map((s) => ({
      ...s,
      images: imagesMap[s.id] || [],
      participantName: partMap[s.participantId] || "Participant",
      voteCount: voteCounts[s.id] || 0,
    }));
  }

  // ==========================================================================
  // 3. VOTING ENGINE & CONTROLS
  // ==========================================================================

  /**
   * Evaluates if voting is currently permissible for an event
   */
  public canVote(event: EventSelect): { allowed: boolean; reason?: string } {
    if (event.votingState === "NOT_STARTED") {
      return { allowed: false, reason: "Voting has not started yet." };
    }
    if (event.votingState === "PAUSED") {
      return { allowed: false, reason: "Voting is currently paused." };
    }
    if (event.votingState === "CLOSED") {
      return { allowed: false, reason: "Voting has ended." };
    }

    const now = new Date();
    if (event.votingStartAt && now < new Date(event.votingStartAt)) {
      return { allowed: false, reason: "Voting has not started yet." };
    }
    if (event.votingEndAt && now > new Date(event.votingEndAt)) {
      return { allowed: false, reason: "Voting has ended." };
    }

    return { allowed: true };
  }

  /**
   * Casts or updates a participant's vote
   * Supports configurable votes_per_participant:
   * - If votes_per_participant === 1: voting for a new submission replaces previous vote in-place
   * - If votes_per_participant > 1: allows voting up to N distinct submissions, rejects duplicates & exceeding N
   */
  public async castVote(
    eventId: UUID,
    voterParticipantId: UUID,
    submissionId: UUID
  ): Promise<{ vote: EventVoteSelect; isNew: boolean; updated: boolean }> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) {
      throw new NotFoundError("Competition event not found.");
    }

    // 1. Validate voting window & state
    const voteCheck = this.canVote(event);
    if (!voteCheck.allowed) {
      throw new BadRequestError(voteCheck.reason || "Voting is not currently active.");
    }

    // 2. Validate voter belongs to event
    const voter = await this.participantsRepo.findById(voterParticipantId);
    if (!voter || voter.eventId !== eventId) {
      throw new BadRequestError("You must be a registered participant of this event to vote.");
    }

    // 3. Validate target submission belongs to event & is published
    const submission = await this.submissionsRepo.findById(submissionId);
    if (!submission || submission.eventId !== eventId) {
      throw new NotFoundError("Submission not found in this event.");
    }

    if (submission.status !== "published") {
      throw new BadRequestError("Cannot vote for an unpublished submission.");
    }

    // 4. Validate self-voting prevention
    if (!event.selfVotingAllowed && submission.participantId === voterParticipantId) {
      throw new BadRequestError("You cannot vote for your own submission.");
    }

    // 5. Check if already voted for this specific submission
    const existingSubmissionVote = await this.votesRepo.findVote(
      eventId,
      voterParticipantId,
      submissionId
    );
    if (existingSubmissionVote) {
      return {
        vote: existingSubmissionVote,
        isNew: false,
        updated: false,
      };
    }

    // 6. Check participant's total vote limit
    const currentVotes = await this.votesRepo.findVotesByParticipant(
      eventId,
      voterParticipantId
    );
    const maxVotes = event.votesPerParticipant || 1;

    let voteResult: { vote: EventVoteSelect; isNew: boolean; updated: boolean };

    if (maxVotes === 1) {
      if (currentVotes.length > 0) {
        // Single vote mode: update existing vote in-place to new submission
        const updated = await this.votesRepo.updateVoteSubmission(
          currentVotes[0].id,
          submissionId
        );
        voteResult = {
          vote: updated,
          isNew: false,
          updated: true,
        };
      } else {
        // First vote
        const created = await this.votesRepo.insertVote(
          eventId,
          voterParticipantId,
          submissionId
        );
        voteResult = {
          vote: created,
          isNew: true,
          updated: false,
        };
      }
    } else {
      // Multi-vote mode (N > 1)
      if (currentVotes.length >= maxVotes) {
        throw new BadRequestError(
          `You have used all ${maxVotes} votes for this event. Remove a vote before voting for another project.`
        );
      }
      const created = await this.votesRepo.insertVote(
        eventId,
        voterParticipantId,
        submissionId
      );
      voteResult = {
        vote: created,
        isNew: true,
        updated: false,
      };
    }

    // Award or reconcile voting points for official club members (100% idempotent)
    if (voter.participantType === "member" && voter.memberId) {
      try {
        const member = await this.membersRepo.findById(voter.memberId);
        if (member && member.status === "active") {
          const votingPoints = this.calculateVotingPoints(
            event.submissionPoints ?? 100,
            event.votingPercentage ?? 40
          );
          if (votingPoints > 0) {
            // Find existing event_votes ledger entries for this member
            const { data: existingLedgerRows } = await supabase
              .from("points_ledger")
              .select("id, reference_id, is_revoked")
              .eq("member_id", voter.memberId)
              .eq("category", "event")
              .eq("reference_type", "event_votes");

            const activeRow = (existingLedgerRows || []).find(
              (r: any) =>
                !r.is_revoked &&
                (r.reference_id === voteResult.vote.id ||
                  (maxVotes === 1 && currentVotes.some((cv) => cv.id === r.reference_id)))
            );

            if (!activeRow) {
              const { data: semData } = await supabase
                .from("semesters")
                .select("id")
                .eq("status", "active")
                .limit(1)
                .single();

              await this.pointsLedgerRepo.create({
                memberId: voter.memberId,
                category: "event",
                referenceType: "event_votes",
                referenceId: voteResult.vote.id,
                semesterId: semData?.id || null,
                points: votingPoints,
                createdBy: "00000000-0000-0000-0000-000000000001",
                remarks: `Event voting points for "${event.name}"`,
              });
              logger.info("[ClubEventsService] Awarded event voting points", {
                eventId,
                memberId: voter.memberId,
                voteId: voteResult.vote.id,
                points: votingPoints,
              });
            } else if (activeRow.reference_id !== voteResult.vote.id) {
              // Vote target was updated in single-vote mode:
              // Update reference_id to the new vote so it's tracked, without duplicating points!
              await supabase
                .from("points_ledger")
                .update({ reference_id: voteResult.vote.id })
                .eq("id", activeRow.id);
            }
          }
        }
      } catch (err) {
        logger.error("[ClubEventsService] Failed to award/reconcile voting points", err);
      }
    }

    return voteResult;
  }

  /**
   * Removes / retracts a participant's vote for a submission
   */
  public async removeVote(
    eventId: UUID,
    voterParticipantId: UUID,
    submissionId: UUID
  ): Promise<{ success: boolean; removed: boolean }> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) {
      throw new NotFoundError("Competition event not found.");
    }

    const voteCheck = this.canVote(event);
    if (!voteCheck.allowed) {
      throw new BadRequestError(voteCheck.reason || "Voting is not currently active.");
    }

    const existing = await this.votesRepo.findVote(eventId, voterParticipantId, submissionId);
    if (!existing) {
      throw new NotFoundError("Vote not found for this submission.");
    }

    const deleted = await this.votesRepo.deleteVote(eventId, voterParticipantId, submissionId);

    // Reconcile points ledger: Revoke voting points for official club members
    if (deleted) {
      const voter = await this.participantsRepo.findById(voterParticipantId);
      if (voter && voter.participantType === "member" && voter.memberId) {
        try {
          await supabase
            .from("points_ledger")
            .update({
              is_revoked: true,
              revoked_at: new Date().toISOString(),
              revocation_reason: "Event vote removed",
            })
            .eq("member_id", voter.memberId)
            .eq("category", "event")
            .eq("reference_type", "event_votes")
            .eq("reference_id", existing.id)
            .eq("is_revoked", false);

          logger.info("[ClubEventsService] Revoked event voting points on vote removal", {
            eventId,
            memberId: voter.memberId,
            voteId: existing.id,
          });
        } catch (err) {
          logger.error("[ClubEventsService] Failed to revoke voting points on vote removal", err);
        }
      }
    }

    return { success: deleted, removed: deleted };
  }

  /**
   * Retrieves all votes cast by a participant for an event
   */
  public async getMyVotes(
    eventId: UUID,
    voterParticipantId: UUID
  ): Promise<EventVoteSelect[]> {
    return this.votesRepo.findVotesByParticipant(eventId, voterParticipantId);
  }

  /**
   * Retrieves a single vote of a participant (convenience / single-vote mode)
   */
  public async getMyVote(
    eventId: UUID,
    voterParticipantId: UUID
  ): Promise<EventVoteSelect | null> {
    return this.votesRepo.findVote(eventId, voterParticipantId);
  }

  // ==========================================================================
  // 4. ADMIN VOTING LIFECYCLE CONTROLS
  // ==========================================================================

  public async startVoting(eventId: UUID, actorId: UUID): Promise<EventSelect> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) throw new NotFoundError("Competition event not found.");

    if (event.votingState === "ACTIVE") {
      throw new BadRequestError("Voting is already active.");
    }

    const updated = await this.eventsRepo.update(
      eventId,
      {
        votingState: "ACTIVE",
        votingStartAt: new Date(),
        votingEndAt: null, // Clear any previous stopped timestamp
      },
      actorId
    );

    await this.logAudit(actorId, "VOTING_STARTED", { eventId, previousState: event.votingState });
    return updated;
  }

  public async pauseVoting(eventId: UUID, actorId: UUID): Promise<EventSelect> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) throw new NotFoundError("Competition event not found.");

    if (event.votingState !== "ACTIVE") {
      throw new BadRequestError("Only active voting can be paused.");
    }

    const updated = await this.eventsRepo.update(eventId, { votingState: "PAUSED" }, actorId);
    await this.logAudit(actorId, "VOTING_PAUSED", { eventId });
    return updated;
  }

  public async resumeVoting(eventId: UUID, actorId: UUID): Promise<EventSelect> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) throw new NotFoundError("Competition event not found.");

    if (event.votingState !== "PAUSED") {
      throw new BadRequestError("Only paused voting can be resumed.");
    }

    const updated = await this.eventsRepo.update(
      eventId,
      {
        votingState: "ACTIVE",
        votingEndAt: null,
      },
      actorId
    );
    await this.logAudit(actorId, "VOTING_RESUMED", { eventId });
    return updated;
  }

  public async stopVoting(eventId: UUID, actorId: UUID): Promise<EventSelect> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) throw new NotFoundError("Competition event not found.");

    if (event.votingState === "CLOSED") {
      throw new BadRequestError("Voting is already closed.");
    }

    const updated = await this.eventsRepo.update(
      eventId,
      {
        votingState: "CLOSED",
        votingEndAt: new Date(),
      },
      actorId
    );

    await this.logAudit(actorId, "VOTING_STOPPED", { eventId });
    return updated;
  }

  // ==========================================================================
  // 5. RANKINGS & WINNER FINALIZATION
  // ==========================================================================

  /**
   * Computes current or final rankings based on actual votes
   * Deterministic tie-breaker: Vote count DESC, then Submission createdAt ASC
   */
  public async getEventRankings(eventId: UUID): Promise<EventRankingItem[]> {
    const rawRankings = await this.votesRepo.getRankings(eventId);
    if (rawRankings.length === 0) return [];

    const subIds = rawRankings.map((r) => r.submissionId);
    const imagesMap = await this.submissionImagesRepo.findBySubmissionIds(subIds);

    // Fetch submission details & participant names
    const { data: subsData } = await supabase
      .from("event_submissions")
      .select("id, title, winner_rank, participant_id, event_participants(participant_type, fresher_name, members(name))")
      .in("id", subIds);

    const subMeta: Record<string, any> = {};
    if (subsData) {
      for (const s of subsData) {
        let name = "Participant";
        const part = s.event_participants as any;
        if (part) {
          if (part.participant_type === "member" && part.members) {
            name = part.members.name;
          } else if (part.fresher_name) {
            name = part.fresher_name;
          }
        }
        subMeta[s.id] = {
          title: s.title,
          winnerRank: s.winner_rank,
          participantName: name,
        };
      }
    }

    return rawRankings.map((r, idx) => ({
      rank: idx + 1,
      submissionId: r.submissionId,
      title: subMeta[r.submissionId]?.title || "Project Submission",
      participantName: subMeta[r.submissionId]?.participantName || "Participant",
      voteCount: r.voteCount,
      winnerRank: subMeta[r.submissionId]?.winnerRank || null,
      submissionCreatedAt: r.submissionCreatedAt,
      images: imagesMap[r.submissionId] || [],
    }));
  }

  /**
   * Finalizes event winners and locks winner ranks
   * Race-condition safe: Uses atomic conditional update
   */
  public async finalizeEventWinners(
    eventId: UUID,
    actorId: UUID
  ): Promise<{ rankings: EventRankingItem[]; winnersCount: number }> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) throw new NotFoundError("Competition event not found.");

    if (event.votingState !== "CLOSED") {
      throw new BadRequestError("Voting must be CLOSED before finalizing winners.");
    }

    if (event.winnersFinalized) {
      throw new BadRequestError("Results have already been finalized.");
    }

    const numWinners = event.numberOfWinners || 1;
    const rankings = await this.getEventRankings(eventId);

    if (rankings.length === 0) {
      throw new BadRequestError("No published submissions available to finalize winners.");
    }

    // Atomic conditional lock: Update winners_finalized only if currently false
    try {
      const updateResult = await db
        .update(events)
        .set({
          winnersFinalized: true,
          winnersFinalizedAt: new Date(),
        })
        .where(
          and(
            eq(events.id, eventId),
            eq(events.winnersFinalized, false)
          )
        )
        .returning();

      if (updateResult.length === 0) {
        throw new BadRequestError("Results have already been finalized.");
      }
    } catch (err: any) {
      if (err instanceof BadRequestError) throw err;
      // REST fallback conditional update
      const { data: updatedEvent, error } = await supabase
        .from("events")
        .update({
          winners_finalized: true,
          winners_finalized_at: new Date().toISOString(),
        })
        .eq("id", eventId)
        .eq("winners_finalized", false)
        .select();

      if (error || !updatedEvent || updatedEvent.length === 0) {
        throw new BadRequestError("Results have already been finalized.");
      }
    }

    // Assign winner ranks systematically
    const winnersCount = Math.min(numWinners, rankings.length);
    for (let i = 0; i < winnersCount; i++) {
      const winner = rankings[i];
      const rank = i + 1;
      await this.submissionsRepo.updateWinnerRank(winner.submissionId, rank);
      winner.winnerRank = rank;
    }

    await this.logAudit(actorId, "WINNERS_FINALIZED", {
      eventId,
      numberOfWinners: winnersCount,
      winners: rankings.slice(0, winnersCount).map((w) => ({
        rank: w.rank,
        submissionId: w.submissionId,
        participantName: w.participantName,
        votes: w.voteCount,
      })),
    });

    return {
      rankings,
      winnersCount,
    };
  }

  // ==========================================================================
  // 6. ADMIN SUBMISSION MANAGEMENT
  // ==========================================================================

  public async updateSubmissionStatus(
    submissionId: UUID,
    status: "draft" | "submitted" | "published" | "rejected" | "hidden",
    adminFeedback: string | undefined,
    actorId: UUID
  ): Promise<EventSubmissionSelect> {
    const submission = await this.submissionsRepo.findById(submissionId);
    if (!submission) throw new NotFoundError("Submission not found.");

    const updated = await this.submissionsRepo.updateStatus(submissionId, status, adminFeedback);
    await this.logAudit(actorId, "SUBMISSION_STATUS_UPDATED", {
      submissionId,
      previousStatus: submission.status,
      newStatus: status,
      adminFeedback,
    });
    return updated;
  }

  // ==========================================================================
  // 7. POINTS LEDGER INTEGRATION & AUDITING
  // ==========================================================================

  /**
   * Safe, idempotent backfill for existing completed submissions and votes
   * Ensures official members have their points credited to the Points Ledger
   */
  public async backfillEventPoints(eventId: UUID): Promise<{
    submissionPointsAwarded: number;
    votingPointsAwarded: number;
  }> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event || !event.isCompetition) return { submissionPointsAwarded: 0, votingPointsAwarded: 0 };

    const subPoints = event.submissionPoints ?? 100;
    const votingPoints = this.calculateVotingPoints(subPoints, event.votingPercentage ?? 40);

    let subCount = 0;
    let voteCount = 0;

    // 1. Scan completed submissions
    const allSubmissions = await this.submissionsRepo.findByEvent(eventId);
    for (const sub of allSubmissions) {
      const part = await this.participantsRepo.findById(sub.participantId);
      if (part && part.participantType === "member" && part.memberId) {
        const existing = await this.pointsLedgerRepo.findByMemberAndReference(part.memberId, sub.id);
        const active = existing.find((e: any) => !e.isRevoked);
        if (!active && subPoints > 0) {
          await this.pointsLedgerRepo.create({
            memberId: part.memberId,
            category: "event",
            referenceType: "event_submissions",
            referenceId: sub.id,
            points: subPoints,
            createdBy: "00000000-0000-0000-0000-000000000001",
            remarks: `Event submission points for "${event.name}"`,
          });
          subCount++;
        }
      }
    }

    // 2. Scan active votes
    const allVotes = await this.votesRepo.findVotesByEvent(eventId);
    for (const vote of allVotes) {
      const voter = await this.participantsRepo.findById(vote.voterParticipantId);
      if (voter && voter.participantType === "member" && voter.memberId) {
        const { data: existingVotes } = await supabase
          .from("points_ledger")
          .select("id, is_revoked")
          .eq("member_id", voter.memberId)
          .eq("category", "event")
          .eq("reference_type", "event_votes")
          .eq("reference_id", vote.id);

        const active = (existingVotes || []).find((e: any) => !e.is_revoked);
        if (!active && votingPoints > 0) {
          await this.pointsLedgerRepo.create({
            memberId: voter.memberId,
            category: "event",
            referenceType: "event_votes",
            referenceId: vote.id,
            points: votingPoints,
            createdBy: "00000000-0000-0000-0000-000000000001",
            remarks: `Event voting points for "${event.name}"`,
          });
          voteCount++;
        }
      }
    }

    return { submissionPointsAwarded: subCount, votingPointsAwarded: voteCount };
  }

  /**
   * Retrieves points statistics and aggregates for an event
   */
  public async getEventPointsStats(eventId: UUID): Promise<{
    submissionPointsConfig: number;
    votingPointsConfig: number;
    votingPercentage: number;
    submissionPointsAwarded: number;
    votingPointsAwarded: number;
    totalEventPointsAwarded: number;
  }> {
    const event = await this.eventsRepo.findById(eventId);
    const subPointsConfig = event?.submissionPoints ?? 100;
    const votingPercentage = event?.votingPercentage ?? 40;
    const votingPointsConfig = this.calculateVotingPoints(subPointsConfig, votingPercentage);

    const allSubmissions = await this.submissionsRepo.findByEvent(eventId);
    const subIds = allSubmissions.map((s) => s.id);
    const allVotes = await this.votesRepo.findVotesByEvent(eventId);
    const voteIds = allVotes.map((v) => v.id);

    let subPointsSum = 0;
    let votePointsSum = 0;

    if (subIds.length > 0) {
      const { data: subRows } = await supabase
        .from("points_ledger")
        .select("points, is_revoked")
        .eq("category", "event")
        .eq("reference_type", "event_submissions")
        .in("reference_id", subIds);

      subPointsSum = (subRows || [])
        .filter((r: any) => !r.is_revoked)
        .reduce((acc: number, curr: any) => acc + (Number(curr.points) || 0), 0);
    }

    if (voteIds.length > 0) {
      const { data: voteRows } = await supabase
        .from("points_ledger")
        .select("points, is_revoked")
        .eq("category", "event")
        .eq("reference_type", "event_votes")
        .in("reference_id", voteIds);

      votePointsSum = (voteRows || [])
        .filter((r: any) => !r.is_revoked)
        .reduce((acc: number, curr: any) => acc + (Number(curr.points) || 0), 0);
    }

    return {
      submissionPointsConfig: subPointsConfig,
      votingPointsConfig,
      votingPercentage,
      submissionPointsAwarded: subPointsSum,
      votingPointsAwarded: votePointsSum,
      totalEventPointsAwarded: subPointsSum + votePointsSum,
    };
  }
}
