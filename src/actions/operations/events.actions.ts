"use server";

/**
 * Operations Domain - Events Server Actions
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
): Promise<ApiResponse<PaginatedResult<EventParticipationSelect>>> {
  logger.debug("[Action: getEventParticipationsAction] Initiating action execution", { eventId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const participations = await eventsService.getEventParticipations(eventId, pagination || {});

    return {
      success: true,
      data: participations,
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

export async function generateEventReportCsvAction(eventId: string): Promise<ApiResponse<string>> {
  logger.info("[Action: generateEventReportCsvAction] Generating event report CSV", { eventId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const participations = await eventsService.getEventParticipations(eventId, { limit: 1000 });

    const headers = ["Participation ID", "Event ID", "Member ID", "Attended", "Verified At"];
    const rows = (participations.items as any[]).map((p) => [
      p.id,
      p.eventId,
      p.memberId,
      p.attended ? "Yes" : "No",
      p.createdAt ? new Date(p.createdAt).toISOString() : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return {
      success: true,
      data: csvContent,
    };
  } catch (error) {
    logger.error("[Action: generateEventReportCsvAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
