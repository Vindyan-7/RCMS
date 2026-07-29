/**
 * Inventory Domain - Inventory Validator Implementation
 */

import { z } from "zod";
import { uuidSchema } from "@/core/validation";

export const createInventoryItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  category: z.string().min(2).max(50),
  quantity: z.number().int().positive().default(1),
  available: z.number().int().nonnegative().optional(),
  condition: z.enum(["good", "damaged", "under_maintenance", "retired"]).default("good").optional(),
  location: z.string().max(100).optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const requestBorrowingSchema = z.object({
  inventoryId: uuidSchema,
  memberId: uuidSchema,
  quantity: z.number().int().positive().default(1).optional(),
});

export const issueBorrowingSchema = z.object({
  borrowingId: uuidSchema,
  dueDate: z.coerce.date(),
});

export const returnBorrowingSchema = z.object({
  borrowingId: uuidSchema,
  conditionOnReturn: z.enum(["good", "damaged", "under_maintenance", "retired"]).default("good").optional(),
  remarks: z.string().optional().nullable(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type RequestBorrowingInput = z.infer<typeof requestBorrowingSchema>;
export type IssueBorrowingInput = z.infer<typeof issueBorrowingSchema>;
export type ReturnBorrowingInput = z.infer<typeof returnBorrowingSchema>;

export class InventoryValidator {
  public static async validateCreateItem(data: unknown): Promise<CreateInventoryItemInput> {
    return createInventoryItemSchema.parseAsync(data);
  }

  public static async validateUpdateItem(data: unknown): Promise<UpdateInventoryItemInput> {
    return updateInventoryItemSchema.parseAsync(data);
  }

  public static async validateRequestBorrowing(data: unknown): Promise<RequestBorrowingInput> {
    return requestBorrowingSchema.parseAsync(data);
  }

  public static async validateIssueBorrowing(data: unknown): Promise<IssueBorrowingInput> {
    return issueBorrowingSchema.parseAsync(data);
  }

  public static async validateReturnBorrowing(data: unknown): Promise<ReturnBorrowingInput> {
    return returnBorrowingSchema.parseAsync(data);
  }
}
