/**
 * Attendance Domain - Volunteer Codes Validator
 */

import { z } from "zod";
import { uuidSchema } from "@/core/validation";

export const generateVolunteerCodeSchema = z.object({
  sessionId: uuidSchema,
  expirationHours: z.number().int().positive().max(24).default(4).optional(),
});

export const validateVolunteerCodeSchema = z.object({
  code: z.string().min(6).max(20),
});

export type GenerateVolunteerCodeInput = z.infer<typeof generateVolunteerCodeSchema>;
export type ValidateVolunteerCodeInput = z.infer<typeof validateVolunteerCodeSchema>;

export class VolunteerCodesValidator {
  public static async validateGenerate(data: unknown): Promise<GenerateVolunteerCodeInput> {
    return generateVolunteerCodeSchema.parseAsync(data);
  }

  public static async validateCode(data: unknown): Promise<ValidateVolunteerCodeInput> {
    return validateVolunteerCodeSchema.parseAsync(data);
  }
}
