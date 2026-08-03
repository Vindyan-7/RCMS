/**
 * Attendance Domain - Attendance Sessions Validator
 */

import { z } from "zod";
import { IValidationPipeline } from "@/core/service/service.types";

export const createAttendanceSessionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100, "Title cannot exceed 100 characters"),
  date: z.coerce.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Invalid start time format (HH:mm:ss)").default("00:00:00").optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Invalid end time format (HH:mm:ss)").default("23:59:59").optional(),
  attendancePoints: z.number().int().positive().default(10).optional(),
  lateThreshold: z.number().int().nonnegative().default(15).optional(),
  latePoints: z.number().int().nonnegative().default(5).optional(),
  status: z.string().default("draft").optional(),
});

export const updateAttendanceSessionSchema = createAttendanceSessionSchema.partial();

export type CreateAttendanceSessionInput = z.infer<typeof createAttendanceSessionSchema>;
export type UpdateAttendanceSessionInput = z.infer<typeof updateAttendanceSessionSchema>;

export class AttendanceSessionsValidator implements IValidationPipeline<CreateAttendanceSessionInput> {
  public static async validateCreate(data: unknown): Promise<CreateAttendanceSessionInput> {
    return createAttendanceSessionSchema.parseAsync(data);
  }

  public static async validateUpdate(data: unknown): Promise<UpdateAttendanceSessionInput> {
    return updateAttendanceSessionSchema.parseAsync(data);
  }

  public async validate(data: unknown): Promise<CreateAttendanceSessionInput> {
    return AttendanceSessionsValidator.validateCreate(data);
  }
}
