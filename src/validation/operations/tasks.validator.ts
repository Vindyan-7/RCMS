/**
 * Operations Domain - Tasks Validator Implementation
 */

import { z } from "zod";
import { uuidSchema } from "@/core/validation";

export const createTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().optional().nullable(),
  points: z.number().int().positive().default(10).optional(),
  status: z.enum(["draft", "active", "completed", "archived"]).default("active").optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const completeTaskSchema = z.object({
  taskId: uuidSchema,
  memberId: uuidSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;

export class TasksValidator {
  public static async validateCreate(data: unknown): Promise<CreateTaskInput> {
    return createTaskSchema.parseAsync(data);
  }

  public static async validateUpdate(data: unknown): Promise<UpdateTaskInput> {
    return updateTaskSchema.parseAsync(data);
  }

  public static async validateComplete(data: unknown): Promise<CompleteTaskInput> {
    return completeTaskSchema.parseAsync(data);
  }
}
