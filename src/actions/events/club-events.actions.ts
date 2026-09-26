"use server";

/**
 * Events Domain - Club Events Server Actions
 * Handles public participant flows, project submissions, gallery fetching, controlled voting,
 * and authenticated admin lifecycle controls.
 */

import { ApiResponse, UUID } from "@/core/types";
import {
  EventSelect,
  EventParticipantSelect,
  EventSubmissionImageSelect,
  EventVoteSelect,
} from "@/db/schema";
import {
  ClubEventsService,
  PublicMemberProfile,
  SubmissionWithImages,
  EventRankingItem,
  EventStorageService,
} from "@/services/events";
import { EventsRepository } from "@/repositories/operations/events.repository";
import {
  EventSubmissionsRepository,
  EventParticipantsRepository,
  EventVotesRepository,
} from "@/repositories/events";
import {
  ClubEventsValidator,
  MemberLookupInput,
  RegisterMemberParticipantInput,
  RegisterFresherParticipantInput,
  SubmitProjectInput,
  CastVoteInput,
  RemoveVoteInput,
  UpdateSubmissionStatusInput,
  CreateEventConfigInput,
  UpdateEventConfigInput,
} from "@/validation/events/club-events.validator";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { revalidatePath } from "next/cache";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-fatal if invoked outside Next.js request context (e.g. testing)
  }
}

const eventsService = new ClubEventsService();
const eventsRepo = new EventsRepository();
const submissionsRepo = new EventSubmissionsRepository();
const participantsRepo = new EventParticipantsRepository();
const votesRepo = new EventVotesRepository();
const storageService = new EventStorageService();

async function getAdminActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001" as UUID,
    role: "super_admin",
    permissions: [
      PERMISSIONS.ACTIVITIES_CREATE,
      PERMISSIONS.ACTIVITIES_VIEW,
      PERMISSIONS.ACTIVITIES_EDIT,
      PERMISSIONS.ACTIVITIES_COMPLETE,
    ],
  };
}

// ============================================================================
// PUBLIC EVENT & PARTICIPANT ACTIONS
// ============================================================================

/**
 * Fetches a competition event for public presentation
 */
export async function getPublicCompetitionEventAction(
  eventId?: string
): Promise<ApiResponse<EventSelect | null>> {
  try {
    if (eventId) {
      const event = await eventsRepo.findById(eventId as UUID);
      if (event && event.isCompetition) {
        return { success: true, data: event };
      }
    }

    // Default to the first active competition event
    const all = await eventsRepo.findAll({ page: 1, limit: 20 });
    const comp = all.items.find((e) => e.isCompetition && e.status !== "archived") || null;

    return { success: true, data: comp };
  } catch (error) {
    logger.error("[Action: getPublicCompetitionEventAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Resolves an official member using SAC Membership ID or Roll Number
 */
export async function resolveMemberForEventAction(
  rawInput: unknown
): Promise<ApiResponse<PublicMemberProfile>> {
  try {
    const input: MemberLookupInput = await ClubEventsValidator.validateMemberLookup(rawInput);
    const profile = await eventsService.resolveMemberForEvent(
      input.eventId as UUID,
      input.membershipId
    );
    return { success: true, data: profile };
  } catch (error) {
    logger.error("[Action: resolveMemberForEventAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Registers an official club member as an event participant
 */
export async function registerMemberParticipantAction(
  rawInput: unknown
): Promise<ApiResponse<EventParticipantSelect>> {
  try {
    const input: RegisterMemberParticipantInput =
      await ClubEventsValidator.validateRegisterMember(rawInput);
    const participant = await eventsService.registerMemberParticipant(
      input.eventId as UUID,
      input.memberId as UUID
    );
    return { success: true, data: participant };
  } catch (error) {
    logger.error("[Action: registerMemberParticipantAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Registers a Fresher / Non-Member participant for an event
 */
export async function registerFresherParticipantAction(
  rawInput: unknown
): Promise<ApiResponse<EventParticipantSelect>> {
  try {
    const input: RegisterFresherParticipantInput =
      await ClubEventsValidator.validateRegisterFresher(rawInput);
    const participant = await eventsService.registerFresherParticipant(
      input.eventId as UUID,
      input.fullName,
      input.mobileNumber
    );
    return { success: true, data: participant };
  } catch (error) {
    logger.error("[Action: registerFresherParticipantAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Retrieves a participant record by ID
 */
export async function getMyEventParticipantAction(
  eventId: string,
  participantId: string
): Promise<ApiResponse<EventParticipantSelect | null>> {
  try {
    const participant = await participantsRepo.findById(participantId as UUID);
    if (!participant || participant.eventId !== eventId) {
      return { success: true, data: null };
    }
    // Sanitize private mobile numbers to prevent data exposure
    const sanitized: EventParticipantSelect = {
      ...participant,
      mobileNumber: participant.mobileNumber
        ? participant.mobileNumber.slice(0, 2) + "******" + participant.mobileNumber.slice(-2)
        : null,
      normalizedMobile: null,
    };
    return { success: true, data: sanitized };
  } catch (error) {
    logger.error("[Action: getMyEventParticipantAction] Error", error);
    return formatErrorResponse(error);
  }
}

// ============================================================================
// PROJECT SUBMISSIONS & GALLERY ACTIONS
// ============================================================================

/**
 * Uploads a project image securely to the server
 */
export async function uploadSubmissionImageAction(
  formData: FormData
): Promise<ApiResponse<{ imageUrl: string; storagePath: string; fileSizeBytes: number; mimeType: string }>> {
  try {
    const file = formData.get("file") as File;
    const eventId = formData.get("eventId") as string;
    const participantId = formData.get("participantId") as string;

    if (!file || !eventId || !participantId) {
      return { success: false, error: "File, eventId, and participantId are required." } as any;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await storageService.uploadSubmissionImage(
      eventId as UUID,
      participantId as UUID,
      {
        buffer,
        mimeType: file.type || "image/jpeg",
        originalName: file.name,
      }
    );

    return { success: true, data: result };
  } catch (error) {
    logger.error("[Action: uploadSubmissionImageAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Uploads an event cover banner image securely
 */
export async function uploadEventCoverImageAction(
  formData: FormData
): Promise<ApiResponse<{ imageUrl: string; storagePath: string; fileSizeBytes: number; mimeType: string }>> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const file = formData.get("file") as File;
    const eventId = formData.get("eventId") as string;

    if (!file || !eventId) {
      return { success: false, error: "File and eventId are required." } as any;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await storageService.uploadEventCoverImage(eventId as UUID, {
      buffer,
      mimeType: file.type || "image/jpeg",
      originalName: file.name,
    });

    return { success: true, data: result };
  } catch (error) {
    logger.error("[Action: uploadEventCoverImageAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Submits a project with photo metadata and description
 */
export async function submitProjectAction(
  rawInput: unknown
): Promise<ApiResponse<SubmissionWithImages>> {
  try {
    const input: SubmitProjectInput = await ClubEventsValidator.validateSubmitProject(rawInput);
    const submission = await eventsService.submitProject(
      input.eventId as UUID,
      input.participantId as UUID,
      {
        title: input.title,
        description: input.description,
        images: input.images,
      }
    );

    safeRevalidatePath(`/events/${input.eventId}`);
    return { success: true, data: submission };
  } catch (error) {
    logger.error("[Action: submitProjectAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Fetches all public competition events for the /events index page
 */
export async function getPublicCompetitionEventsListAction(): Promise<ApiResponse<EventSelect[]>> {
  try {
    const all = await eventsRepo.findAll({ page: 1, limit: 50 });
    const comp = all.items.filter((e) => e.isCompetition && e.status !== "archived");
    return { success: true, data: comp };
  } catch (error) {
    logger.error("[Action: getPublicCompetitionEventsListAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Fetches approved/published submissions for the public gallery
 */
export async function getPublishedSubmissionsAction(
  eventId: string
): Promise<ApiResponse<SubmissionWithImages[]>> {
  try {
    const event = await eventsRepo.findById(eventId as UUID);
    const submissions = await eventsService.getPublishedSubmissions(eventId as UUID);
    const sanitized = submissions.map((s) => ({
      ...s,
      voteCount: event?.showVoteCounts ? s.voteCount : undefined,
    }));
    return { success: true, data: sanitized };
  } catch (error) {
    logger.error("[Action: getPublishedSubmissionsAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Retrieves the submission for a specific participant (for self-submission review and duplicate prevention)
 */
export async function getMySubmissionAction(
  eventId: string,
  participantId: string
): Promise<ApiResponse<SubmissionWithImages | null>> {
  try {
    const sub = await submissionsRepo.findByEventAndParticipant(
      eventId as UUID,
      participantId as UUID
    );
    if (!sub) return { success: true, data: null };

    const imagesMap = await (eventsService as any)["submissionImagesRepo"].findBySubmissionIds([sub.id as UUID]);
    return {
      success: true,
      data: {
        ...sub,
        images: imagesMap[sub.id] || [],
      },
    };
  } catch (error) {
    logger.error("[Action: getMySubmissionAction] Error", error);
    return formatErrorResponse(error);
  }
}

// ============================================================================
// VOTING ACTIONS
// ============================================================================

/**
 * Retrieves the current vote of a participant (convenience / single-vote mode)
 */
export async function getMyVoteAction(
  eventId: string,
  participantId: string
): Promise<ApiResponse<EventVoteSelect | null>> {
  try {
    const vote = await eventsService.getMyVote(eventId as UUID, participantId as UUID);
    return { success: true, data: vote };
  } catch (error) {
    logger.error("[Action: getMyVoteAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Retrieves all votes cast by a participant for an event (multi-vote mode)
 */
export async function getMyVotesAction(
  eventId: string,
  participantId: string
): Promise<ApiResponse<EventVoteSelect[]>> {
  try {
    const votes = await eventsService.getMyVotes(eventId as UUID, participantId as UUID);
    return { success: true, data: votes };
  } catch (error) {
    logger.error("[Action: getMyVotesAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Casts or changes a vote for a project submission
 */
export async function castVoteAction(
  rawInput: unknown
): Promise<ApiResponse<{ vote: EventVoteSelect; isNew: boolean; updated: boolean }>> {
  try {
    const input: CastVoteInput = await ClubEventsValidator.validateCastVote(rawInput);
    const result = await eventsService.castVote(
      input.eventId as UUID,
      input.participantId as UUID,
      input.submissionId as UUID
    );

    safeRevalidatePath(`/events/${input.eventId}`);
    return { success: true, data: result };
  } catch (error) {
    logger.error("[Action: castVoteAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Removes / retracts a participant's vote for a submission
 */
export async function removeVoteAction(
  rawInput: unknown
): Promise<ApiResponse<{ removed: boolean }>> {
  try {
    const input: RemoveVoteInput = await ClubEventsValidator.validateRemoveVote(rawInput);
    const result = await eventsService.removeVote(
      input.eventId as UUID,
      input.participantId as UUID,
      input.submissionId as UUID
    );

    safeRevalidatePath(`/events/${input.eventId}`);
    return { success: true, data: { removed: result.removed } };
  } catch (error) {
    logger.error("[Action: removeVoteAction] Error", error);
    return formatErrorResponse(error);
  }
}

// ============================================================================
// ADMIN MANAGEMENT ACTIONS
// ============================================================================

export interface ClubEventAdminListItem extends EventSelect {
  stats: {
    participants: number;
    submissions: number;
    publishedSubmissions: number;
    votes: number;
  };
}

/**
 * Retrieves all competition events enriched with metrics for the Admin Dashboard
 */
export async function getClubEventsAdminAction(): Promise<
  ApiResponse<{
    events: ClubEventAdminListItem[];
  }>
> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const all = await eventsRepo.findAll({ page: 1, limit: 100 });
    const competitionEvents = all.items.filter((e) => e.isCompetition);

    const enriched = await Promise.all(
      competitionEvents.map(async (e) => {
        try {
          const [pStats, sStats, vCount] = await Promise.all([
            participantsRepo.getParticipantStats(e.id as UUID),
            submissionsRepo.countByEvent(e.id as UUID),
            votesRepo.countTotalVotesByEvent(e.id as UUID),
          ]);
          return {
            ...e,
            stats: {
              participants: pStats.total,
              submissions: sStats.total,
              publishedSubmissions: sStats.published,
              votes: vCount,
            },
          };
        } catch {
          return {
            ...e,
            stats: {
              participants: 0,
              submissions: 0,
              publishedSubmissions: 0,
              votes: 0,
            },
          };
        }
      })
    );

    return {
      success: true,
      data: {
        events: enriched,
      },
    };
  } catch (error) {
    logger.error("[Action: getClubEventsAdminAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Creates a new competition event from the Admin Dashboard
 */
export async function createCompetitionEventAction(
  rawInput: unknown
): Promise<ApiResponse<EventSelect>> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_CREATE);

    const validated: CreateEventConfigInput =
      await ClubEventsValidator.validateCreateEventConfig(rawInput);

    const newEvent = await eventsRepo.create(
      {
        name: validated.name,
        description: validated.description || null,
        venue: validated.venue || "Robotics Club Lab / Makerspace",
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        points: validated.points || 35,
        status: "active",
        isCompetition: true,
        coverImageUrl: validated.coverImageUrl || null,
        submissionStartAt: validated.submissionStartAt || new Date(),
        submissionEndAt:
          validated.submissionEndAt ||
          new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        minImages: validated.minImages ?? 1,
        maxImages: validated.maxImages ?? 2,
        minDescriptionChars: validated.minDescriptionChars ?? 100,
        votingState: "NOT_STARTED",
        votingStartAt:
          validated.votingStartAt ||
          new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        votingEndAt:
          validated.votingEndAt ||
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        votesPerParticipant: validated.votesPerParticipant ?? 1,
        selfVotingAllowed: validated.selfVotingAllowed ?? false,
        showVoteCounts: validated.showVoteCounts ?? false,
        numberOfWinners: validated.numberOfWinners ?? 1,
        submissionPoints: validated.submissionPoints ?? 100,
        votingPercentage: validated.votingPercentage ?? 40,
        winnersFinalized: false,
        createdBy: actor.id,
        updatedBy: actor.id,
      } as any,
      actor.id
    );

    safeRevalidatePath("/dashboard/events");
    return { success: true, data: newEvent };
  } catch (error) {
    logger.error("[Action: createCompetitionEventAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Retrieves full event administration workspace details including submissions and metrics
 */
export async function getCompetitionEventAdminAction(
  eventId: string
): Promise<
  ApiResponse<{
    event: EventSelect;
    stats: {
      totalParticipants: number;
      members: number;
      freshers: number;
      totalSubmissions: number;
      publishedSubmissions: number;
      submittedSubmissions: number;
      rejectedSubmissions: number;
      totalVotes: number;
    };
    submissions: SubmissionWithImages[];
    rankings: EventRankingItem[];
    pointsStats: {
      submissionPointsConfig: number;
      votingPointsConfig: number;
      votingPercentage: number;
      submissionPointsAwarded: number;
      votingPointsAwarded: number;
      totalEventPointsAwarded: number;
    };
  }>
> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const event = await eventsRepo.findById(eventId as UUID);
    if (!event) return { success: false, error: "Event not found." } as any;

    const partStats = await participantsRepo.getParticipantStats(eventId as UUID);
    const subStats = await submissionsRepo.countByEvent(eventId as UUID);

    const allSubs = await submissionsRepo.findByEvent(eventId as UUID);
    const subIds = allSubs.map((s) => s.id);
    const imagesMap = await eventsService["submissionImagesRepo"].findBySubmissionIds(subIds);
    const voteCounts = await eventsService["votesRepo"].getSubmissionVoteCounts(eventId as UUID);

    const submissionsEnriched: SubmissionWithImages[] = allSubs.map((s) => ({
      ...s,
      images: imagesMap[s.id] || [],
      voteCount: voteCounts[s.id] || 0,
    }));

    const rankings = await eventsService.getEventRankings(eventId as UUID);
    const totalVotes = await eventsService["votesRepo"].countTotalVotesByEvent(eventId as UUID);
    const pointsStats = await eventsService.getEventPointsStats(eventId as UUID);

    return {
      success: true,
      data: {
        event,
        stats: {
          totalParticipants: partStats.total,
          members: partStats.members,
          freshers: partStats.freshers,
          totalSubmissions: subStats.total,
          publishedSubmissions: subStats.published,
          submittedSubmissions: subStats.submitted,
          rejectedSubmissions: subStats.rejected,
          totalVotes,
        },
        submissions: submissionsEnriched,
        rankings,
        pointsStats,
      },
    };
  } catch (error) {
    logger.error("[Action: getCompetitionEventAdminAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Triggers safe, idempotent points backfill for an event
 */
export async function backfillEventPointsAction(
  eventId: string
): Promise<ApiResponse<{ submissionPointsAwarded: number; votingPointsAwarded: number }>> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const result = await eventsService.backfillEventPoints(eventId as UUID);
    safeRevalidatePath(`/dashboard/events/${eventId}`);
    return { success: true, data: result };
  } catch (error) {
    logger.error("[Action: backfillEventPointsAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Updates competition event configuration
 */
export async function updateCompetitionEventAction(
  eventId: string,
  rawInput: unknown
): Promise<ApiResponse<EventSelect>> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const validated: UpdateEventConfigInput =
      await ClubEventsValidator.validateUpdateEventConfig(rawInput);
    const updated = await eventsRepo.update(eventId as UUID, validated as any, actor.id);

    safeRevalidatePath(`/dashboard/events`);
    safeRevalidatePath(`/events/${eventId}`);
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Action: updateCompetitionEventAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Updates a submission status (approve/publish, reject, hide)
 */
export async function updateSubmissionStatusAction(
  rawInput: unknown
): Promise<ApiResponse<any>> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const input: UpdateSubmissionStatusInput =
      await ClubEventsValidator.validateUpdateSubmissionStatus(rawInput);
    const updated = await eventsService.updateSubmissionStatus(
      input.submissionId as UUID,
      input.status,
      input.adminFeedback,
      actor.id
    );

    safeRevalidatePath(`/dashboard/events`);
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Action: updateSubmissionStatusAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Starts voting for an event
 */
export async function startVotingAction(eventId: string): Promise<ApiResponse<EventSelect>> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const updated = await eventsService.startVoting(eventId as UUID, actor.id);
    safeRevalidatePath(`/dashboard/events`);
    safeRevalidatePath(`/events/${eventId}`);
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Action: startVotingAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Pauses voting for an event
 */
export async function pauseVotingAction(eventId: string): Promise<ApiResponse<EventSelect>> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const updated = await eventsService.pauseVoting(eventId as UUID, actor.id);
    safeRevalidatePath(`/dashboard/events`);
    safeRevalidatePath(`/events/${eventId}`);
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Action: pauseVotingAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Resumes voting for an event
 */
export async function resumeVotingAction(eventId: string): Promise<ApiResponse<EventSelect>> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const updated = await eventsService.resumeVoting(eventId as UUID, actor.id);
    safeRevalidatePath(`/dashboard/events`);
    safeRevalidatePath(`/events/${eventId}`);
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Action: resumeVotingAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Stops/closes voting for an event
 */
export async function stopVotingAction(eventId: string): Promise<ApiResponse<EventSelect>> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const updated = await eventsService.stopVoting(eventId as UUID, actor.id);
    safeRevalidatePath(`/dashboard/events`);
    safeRevalidatePath(`/events/${eventId}`);
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Action: stopVotingAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Computes event rankings
 */
export async function getEventRankingsAction(
  eventId: string
): Promise<ApiResponse<EventRankingItem[]>> {
  try {
    const rankings = await eventsService.getEventRankings(eventId as UUID);
    return { success: true, data: rankings };
  } catch (error) {
    logger.error("[Action: getEventRankingsAction] Error", error);
    return formatErrorResponse(error);
  }
}

/**
 * Finalizes event winners
 */
export async function finalizeEventWinnersAction(
  eventId: string
): Promise<ApiResponse<{ rankings: EventRankingItem[]; winnersCount: number }>> {
  try {
    const actor = await getAdminActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_COMPLETE);

    const result = await eventsService.finalizeEventWinners(eventId as UUID, actor.id);
    safeRevalidatePath(`/dashboard/events`);
    safeRevalidatePath(`/events/${eventId}`);
    return { success: true, data: result };
  } catch (error) {
    logger.error("[Action: finalizeEventWinnersAction] Error", error);
    return formatErrorResponse(error);
  }
}
