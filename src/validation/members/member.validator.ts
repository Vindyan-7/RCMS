/**
 * Members Domain - Member Validator Implementation
 */

import { z } from "zod";
import { IValidationPipeline } from "@/core/service/service.types";
import {
  emailSchema,
  phoneSchema,
  rollNumberSchema,
  memberIdSchema,
  uuidSchema,
} from "@/core/validation";

export const createMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  email: emailSchema,
  phone: phoneSchema,
  rollNumber: rollNumberSchema,
  memberId: memberIdSchema.optional(),
  clubMembershipId: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  branchId: uuidSchema.optional().nullable(),
  year: z.number().int().min(1).max(4).optional().nullable(),
  gender: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "alumni", "suspended"]).optional(),
  photoUrl: z.string().url("Invalid photo URL format").optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});

export const updateMemberSchema = createMemberSchema.partial();

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export class MemberValidator implements IValidationPipeline<CreateMemberInput> {
  public static async validateCreate(data: unknown): Promise<CreateMemberInput> {
    return createMemberSchema.parseAsync(data);
  }

  public static async validateUpdate(data: unknown): Promise<UpdateMemberInput> {
    return updateMemberSchema.parseAsync(data);
  }

  public async validate(data: unknown): Promise<CreateMemberInput> {
    return MemberValidator.validateCreate(data);
  }
}
