"use server";

/**
 * Operations Domain - Events Server Actions
 * Production Polish: Enriched participations & Event CSV Export
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { EventSelect, EventParticipationSelect } from "@/db/schema";
import { EventsRepository, EventParticipationsRepository } from "@/repositories/operations";
import { MembersRepository } from "@/repositories/members";
import { EventsService } from "@/services/operations";
import { EventsValidator } from "@/validation/operations";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";
import { supabase } from "@/db";

const eventsRepo = new EventsRepository();
const participationsRepo = new EventParticipationsRepository();
const membersRepo = new MembersRepository();
const eventsService = new EventsService(eventsRepo, participationsRepo, membersRepo);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.ACTIVITIES_CREATE, PERMISSIONS.ACTIVITIES_VIEW, PERMISSIONS.ACTIVITIES_EDIT, PERMISSIONS.ACTIVITIES_COMPLETE],
  };
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function createEventAction(
  rawInput: unknown
): Promise<ApiResponse<EventSelect>> {
  logger.info("[Action: createEventAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_CREATE);

    const validatedInput = await EventsValidator.validateCreate(rawInput);
    const event = await eventsService.createEvent(validatedInput, actor.id);

    logger.info("[Action: createEventAction] Action completed successfully", { id: event.id });

    return {
      success: true,
      data: event,
    };
  } catch (error) {
    logger.error("[Action: createEventAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function updateEventAction(
  id: string,
  rawInput: unknown
): Promise<ApiResponse<EventSelect>> {
  logger.info("[Action: updateEventAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const validatedInput = await EventsValidator.validateUpdate(rawInput);
    const event = await eventsService.updateEvent(id, validatedInput, actor.id);

    return {
      success: true,
      data: event,
    };
  } catch (error) {
    logger.error("[Action: updateEventAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function verifyEventParticipationAction(
  rawInput: unknown
): Promise<ApiResponse<EventParticipationSelect>> {
  logger.info("[Action: verifyEventParticipationAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_COMPLETE);

    const validatedInput = await EventsValidator.validateVerify(rawInput);
    const participation = await eventsService.verifyEventParticipation(
      validatedInput.eventId,
      validatedInput.memberId,
      actor.id
    );

    return {
      success: true,
      data: participation,
    };
  } catch (error) {
    logger.error("[Action: verifyEventParticipationAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getEventParticipationsAction(
  eventId: string,
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<any>>> {
  logger.debug("[Action: getEventParticipationsAction] Initiating action execution with member enrichment", { eventId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const participations = await eventsService.getEventParticipations(eventId, pagination || {});
    const items = participations.items || [];

    // Fetch member details for enrichment
    const { data: membersData } = await supabase.from("members").select("id, name, member_id, club_membership_id, branch");
    const memberMap = new Map((membersData || []).map((m: any) => [m.id, m]));

    const enrichedItems = items.map((p: any) => {
      const mem = memberMap.get(p.memberId);
      return {
        ...p,
        memberName: mem?.name || "Member",
        membershipId: mem?.club_membership_id || mem?.member_id || "—",
        branch: (mem?.branch || "—").toUpperCase(),
        verifierName: "System Coordinator",
        participationStatus: "Registered",
        verificationStatus: p.attended ? "Verified" : "Pending",
      };
    });

    return {
      success: true,
      data: {
        ...participations,
        items: enrichedItems,
      },
    };
  } catch (error) {
    logger.error("[Action: getEventParticipationsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getEventsAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<EventSelect>>> {
  logger.debug("[Action: getEventsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const eventsList = await eventsService.getAll(pagination || {});

    return {
      success: true,
      data: eventsList,
    };
  } catch (error) {
    logger.error("[Action: getEventsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function updateEventStatusAction(
  id: string,
  status: string
): Promise<ApiResponse<EventSelect>> {
  logger.info("[Action: updateEventStatusAction] Updating event status", { id, status });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const event = await eventsService.updateEvent(id, { status } as any, actor.id);

    return {
      success: true,
      data: event,
    };
  } catch (error) {
    logger.error("[Action: updateEventStatusAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function exportEventCsvAction(
  eventId: string
): Promise<ApiResponse<{ csvContent: string; filename: string }>> {
  logger.info("[Action: exportEventCsvAction] Generating event participation CSV", { eventId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const event = await eventsRepo.findById(eventId);
    if (!event) {
      return { success: false, error: { code: "NOT_FOUND", message: "Event not found" } };
    }

    // Active Semester Name
    const { data: semData } = await supabase
      .from("semesters")
      .select("name")
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(1);
    const semesterName = semData && semData[0] ? semData[0].name : "Active Semester";

    // Event participations
    const participationsRes = await participationsRepo.getByEventId(eventId, { limit: 1000 });
    const participations = participationsRes.items || [];

    const { data: membersData } = await supabase.from("members").select("id, name, member_id, club_membership_id, branch");
    const memberMap = new Map((membersData || []).map((m: any) => [m.id, m]));

    const headers = [
      "Event Name",
      "Semester",
      "Member Name",
      "Membership ID",
      "Branch",
      "Participation Status",
      "Verification Date",
      "Points Awarded",
      "Verifier",
    ];

    const eventPoints = (event as any).points ?? 25;

    const rows = participations.map((p: any) => {
      const mem = memberMap.get(p.memberId);
      const verifDateStr = p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN") : "—";
      const statusStr = p.attended ? "Verified Participant" : "Registered";
      const ptsStr = p.attended ? String(eventPoints) : "0";

      return [
        event.name,
        semesterName,
        mem?.name || "Member",
        mem?.club_membership_id || mem?.member_id || "—",
        (mem?.branch || "—").toUpperCase(),
        statusStr,
        verifDateStr,
        ptsStr,
        "System Coordinator",
      ];
    });

    const csvContent = "\uFEFF" + [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const sanitizedName = event.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `event_${sanitizedName}.csv`;

    return {
      success: true,
      data: {
        csvContent,
        filename,
      },
    };
  } catch (error) {
    logger.error("[Action: exportEventCsvAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export const generateEventReportCsvAction = exportEventCsvAction;
