/**
 * Communication Domain - Communication Validator Implementation
 */

import { z } from "zod";
import { uuidSchema } from "@/core/validation";

export const sendNotificationSchema = z.object({
  recipientId: uuidSchema,
  title: z.string().min(2, "Title must be at least 2 characters").max(150, "Title cannot exceed 150 characters"),
  message: z.string().min(1, "Message content is required"),
  type: z.enum(["welcome", "event_reminder", "task_assigned", "point_awarded", "general", "system"]).default("general").optional(),
  channel: z.enum(["in_app", "email", "whatsapp", "push"]).default("in_app").optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal").optional(),
});

export const broadcastNotificationSchema = z.object({
  recipientIds: z.array(uuidSchema).min(1, "At least one recipient ID must be provided"),
  title: z.string().min(2).max(150),
  message: z.string().min(1),
});

export const createTemplateSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  subject: z.string().max(150).optional().nullable(),
  templateText: z.string().min(1),
  channel: z.enum(["in_app", "email", "whatsapp", "push"]).default("in_app").optional(),
  description: z.string().optional().nullable(),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export class CommunicationValidator {
  public static async validateSend(data: unknown): Promise<SendNotificationInput> {
    return sendNotificationSchema.parseAsync(data);
  }

  public static async validateBroadcast(data: unknown): Promise<BroadcastNotificationInput> {
    return broadcastNotificationSchema.parseAsync(data);
  }

  public static async validateTemplate(data: unknown): Promise<CreateTemplateInput> {
    return createTemplateSchema.parseAsync(data);
  }
}
