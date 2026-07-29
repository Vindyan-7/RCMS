/**
 * Communication Domain - Centralized Communication Service Implementation
 */

import { NotificationsRepository } from "@/repositories/communication/notifications.repository";
import { NotificationTemplatesRepository } from "@/repositories/communication/notification_templates.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { NotificationSelect, NotificationInsert, NotificationTemplateSelect, NotificationTemplateInsert } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { NotFoundError } from "@/core/errors";
import { logger } from "@/core/logger";

export class CommunicationService {
  constructor(
    private readonly notificationsRepo: NotificationsRepository,
    private readonly templatesRepo: NotificationTemplatesRepository,
    private readonly membersRepo?: MembersRepository
  ) {}

  public async sendNotification(
    data: {
      recipientId: UUID;
      title: string;
      message: string;
      type?: string;
      channel?: string;
      priority?: string;
      scheduledAt?: Date;
    },
    actorId?: UUID
  ): Promise<NotificationSelect> {
    logger.info("[CommunicationService] Sending notification", {
      recipientId: data.recipientId,
      title: data.title,
      channel: data.channel || "in_app",
      actorId,
    });

    if (this.membersRepo) {
      const member = await this.membersRepo.findById(data.recipientId);
      if (!member) {
        throw new NotFoundError(`Recipient member ${data.recipientId} not found`, "MEMBER_NOT_FOUND");
      }
    }

    return this.notificationsRepo.create({
      recipientId: data.recipientId,
      title: data.title,
      message: data.message,
      type: data.type || "general",
      channel: data.channel || "in_app",
      priority: data.priority || "normal",
      status: "delivered",
      deliveredAt: new Date(),
      scheduledAt: data.scheduledAt,
      createdBy: actorId,
    });
  }

  public async sendTemplateNotification(
    templateCode: string,
    recipientId: UUID,
    variables: Record<string, string>,
    actorId?: UUID
  ): Promise<NotificationSelect> {
    logger.info("[CommunicationService] Sending template notification", { templateCode, recipientId });

    const template = await this.templatesRepo.findByCode(templateCode);
    if (!template) {
      throw new NotFoundError(`Notification template ${templateCode} not found`);
    }

    let interpolatedText = template.templateText;
    for (const [key, value] of Object.entries(variables)) {
      interpolatedText = interpolatedText.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    return this.sendNotification(
      {
        recipientId,
        title: template.subject || template.name,
        message: interpolatedText,
        type: template.code,
        channel: template.channel,
      },
      actorId
    );
  }

  public async broadcastNotification(
    recipientIds: UUID[],
    title: string,
    message: string,
    actorId?: UUID
  ): Promise<NotificationSelect[]> {
    logger.info("[CommunicationService] Broadcasting notification to recipients", {
      count: recipientIds.length,
      actorId,
    });

    const payloadBatch: NotificationInsert[] = recipientIds.map((id) => ({
      recipientId: id,
      title,
      message,
      type: "broadcast",
      channel: "in_app",
      status: "delivered",
      deliveredAt: new Date(),
      createdBy: actorId,
    }));

    return this.notificationsRepo.createBatch(payloadBatch);
  }

  public async markAsRead(id: UUID): Promise<NotificationSelect> {
    logger.info("[CommunicationService] Marking notification as read", { id });
    const notification = await this.notificationsRepo.markAsRead(id);
    if (!notification) {
      throw new NotFoundError(`Notification ${id} not found`);
    }
    return notification;
  }

  public async markAllAsRead(recipientId: UUID): Promise<boolean> {
    logger.info("[CommunicationService] Marking all notifications as read for recipient", { recipientId });
    return this.notificationsRepo.markAllAsRead(recipientId);
  }

  public async getMemberNotifications(
    recipientId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<NotificationSelect>> {
    return this.notificationsRepo.getByRecipientId(recipientId, query);
  }

  public async createTemplate(
    data: any,
    actorId: UUID
  ): Promise<NotificationTemplateSelect> {
    return this.templatesRepo.create(data, actorId);
  }

  public async getAllTemplates(query: PaginationQuery): Promise<PaginatedResult<NotificationTemplateSelect>> {
    return this.templatesRepo.findAll(query);
  }

  public async getAllNotifications(query: PaginationQuery): Promise<PaginatedResult<NotificationSelect>> {
    return this.notificationsRepo.findAll(query);
  }
}
