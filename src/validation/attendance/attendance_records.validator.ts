/**
 * Attendance Domain - Attendance Records Validator
 */

import { z } from "zod";
import { uuidSchema } from "@/core/validation";

export const recordAttendanceSchema = z.object({
  memberId: uuidSchema,
  sessionId: uuidSchema,
  method: z.enum(["qr", "manual"]).default("qr").optional(),
  remarks: z.string().max(255).optional().nullable(),
});

export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;

export class AttendanceRecordsValidator {
  public static async validateRecord(data: unknown): Promise<RecordAttendanceInput> {
    return recordAttendanceSchema.parseAsync(data);
  }
}
