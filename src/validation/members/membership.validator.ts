/**
 * Members Domain - Membership Validator Implementation
 */

import { z } from "zod";
import { IValidationPipeline } from "@/core/service/service.types";
import { uuidSchema } from "@/core/validation";

export const createMembershipSchema = z.object({
  memberId: uuidSchema,
  academicYearId: uuidSchema,
  semesterId: uuidSchema,
  roleId: uuidSchema.optional().nullable(),
  status: z.enum(["active", "inactive", "renewed"]).default("active").optional(),
  joinDate: z.coerce.date().optional(),
  exitDate: z.coerce.date().optional().nullable(),
});

export const updateMembershipSchema = createMembershipSchema.partial();

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;

export class MembershipValidator implements IValidationPipeline<CreateMembershipInput> {
  public static async validateCreate(data: unknown): Promise<CreateMembershipInput> {
    return createMembershipSchema.parseAsync(data);
  }

  public static async validateUpdate(data: unknown): Promise<UpdateMembershipInput> {
    return updateMembershipSchema.parseAsync(data);
  }

  public async validate(data: unknown): Promise<CreateMembershipInput> {
    return MembershipValidator.validateCreate(data);
  }
}
