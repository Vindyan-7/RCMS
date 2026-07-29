/**
 * Operations Domain - Events Validator Implementation
 */

import { z } from "zod";
import { uuidSchema } from "@/core/validation";

export const createEventSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().optional().nullable(),
  venue: z.string().max(100).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  points: z.number().int().positive().default(20).optional(),
  status: z.string().default("upcoming").optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const verifyParticipationSchema = z.object({
  eventId: uuidSchema,
  memberId: uuidSchema,
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type VerifyParticipationInput = z.infer<typeof verifyParticipationSchema>;

export class EventsValidator {
  public static async validateCreate(data: unknown): Promise<CreateEventInput> {
    return createEventSchema.parseAsync(data);
  }

  public static async validateUpdate(data: unknown): Promise<UpdateEventInput> {
    return updateEventSchema.parseAsync(data);
  }

  public static async validateVerify(data: unknown): Promise<VerifyParticipationInput> {
    return verifyParticipationSchema.parseAsync(data);
  }
}
