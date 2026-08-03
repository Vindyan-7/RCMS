/**
 * Operations Domain - Events Service Implementation
 */

import { BaseService } from "@/core/service/base-service";
import { EventsRepository } from "@/repositories/operations/events.repository";
import { EventParticipationsRepository } from "@/repositories/operations/event_participations.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { EventSelect, EventInsert, EventParticipationSelect } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { ConflictError, NotFoundError, BadRequestError } from "@/core/errors";
import { logger } from "@/core/logger";

import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { SemesterContextService } from "@/services/academic/semester-context.service";

export class EventsService extends BaseService<
  EventSelect,
  EventInsert,
  Partial<EventInsert>
> {
  constructor(
    private readonly eventsRepo: EventsRepository,
    private readonly participationsRepo: EventParticipationsRepository,
    private readonly membersRepo?: MembersRepository,
    private readonly membershipsRepo: MembershipsRepository = new MembershipsRepository(),
    private readonly semesterContextService: SemesterContextService = new SemesterContextService()
  ) {
    super(eventsRepo, undefined, "EventsService");
  }

  public async createEvent(
    data: any,
    actorId: UUID
  ): Promise<EventSelect> {
    logger.info("[EventsService] Creating event", { name: data.name, actorId });
    const activeSemester = await this.semesterContextService.ensureActiveSemester("Event creation");
    const payload = {
      ...data,
      semesterId: activeSemester.id,
    };
    return this.eventsRepo.create(payload, actorId);
  }

  public async updateEvent(
    id: UUID,
    data: Partial<EventInsert>,
    actorId: UUID
  ): Promise<EventSelect> {
    logger.info("[EventsService] Updating event", { id, actorId });
    await this.getById(id);
    return this.eventsRepo.update(id, data, actorId);
  }

  public async verifyEventParticipation(
    eventId: UUID,
    memberId: UUID,
    actorId: UUID
  ): Promise<EventParticipationSelect> {
    logger.info("[EventsService] Verifying member event participation", { eventId, memberId, actorId });

    const event = await this.getById(eventId);
    if (event.status === "cancelled" || event.status === "archived") {
      throw new BadRequestError(`Event ${eventId} is currently ${event.status}. Cannot verify participation`);
    }

    if (this.membersRepo) {
      const member = await this.membersRepo.findById(memberId);
      if (!member) {
        throw new NotFoundError(`Member ${memberId} not found`, "MEMBER_NOT_FOUND");
      }
    }

    const existing = await this.participationsRepo.findByEventAndMember(eventId, memberId);
    if (existing) {
      throw new ConflictError("Member participation has already been verified for this event");
    }

    return this.participationsRepo.create({
      eventId,
      memberId,
      verifiedBy: actorId,
    });
  }

  public async getEventParticipations(
    eventId: UUID,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<EventParticipationSelect>> {
    return this.participationsRepo.getByEventId(eventId, pagination);
  }

  public async cancelEvent(id: UUID, actorId: UUID): Promise<EventSelect> {
    logger.info("[EventsService] Cancelling event", { id, actorId });
    await this.getById(id);
    return this.eventsRepo.update(id, { status: "cancelled" }, actorId);
  }
}
