/**
 * Points Domain - Points Validator Implementation
 */

import { z } from "zod";
import { uuidSchema } from "@/core/validation";

export const awardPointsSchema = z.object({
  memberId: uuidSchema,
  category: z.string().min(2).max(50),
  points: z.number().int().positive("Points must be positive"),
  referenceType: z.string().max(50).optional().nullable(),
  referenceId: uuidSchema.optional().nullable(),
  remarks: z.string().max(255).optional().nullable(),
});

export const deductPointsSchema = z.object({
  memberId: uuidSchema,
  category: z.string().min(2).max(50).default("penalty").optional(),
  points: z.number().int().positive("Deduction points must be positive"),
  remarks: z.string().max(255).optional().nullable(),
});

export const rollbackTransactionSchema = z.object({
  transactionId: uuidSchema,
  reason: z.string().min(3, "Reason must be at least 3 characters").max(255),
});

export const createPointRuleSchema = z.object({
  trigger: z.string().min(2).max(50),
  category: z.string().min(2).max(50),
  points: z.number().int().positive(),
  enabled: z.boolean().default(true).optional(),
  priority: z.number().int().default(1).optional(),
  description: z.string().optional().nullable(),
});

export type AwardPointsInput = z.infer<typeof awardPointsSchema>;
export type DeductPointsInput = z.infer<typeof deductPointsSchema>;
export type RollbackTransactionInput = z.infer<typeof rollbackTransactionSchema>;
export type CreatePointRuleInput = z.infer<typeof createPointRuleSchema>;

export class PointsValidator {
  public static async validateAward(data: unknown): Promise<AwardPointsInput> {
    return awardPointsSchema.parseAsync(data);
  }

  public static async validateDeduct(data: unknown): Promise<DeductPointsInput> {
    return deductPointsSchema.parseAsync(data);
  }

  public static async validateRollback(data: unknown): Promise<RollbackTransactionInput> {
    return rollbackTransactionSchema.parseAsync(data);
  }

  public static async validateRule(data: unknown): Promise<CreatePointRuleInput> {
    return createPointRuleSchema.parseAsync(data);
  }
}
