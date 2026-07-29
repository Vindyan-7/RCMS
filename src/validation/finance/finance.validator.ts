/**
 * Finance Domain - Finance Validator Implementation
 */

import { z } from "zod";
import { uuidSchema, emailSchema, phoneSchema } from "@/core/validation";

export const createSponsorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  type: z.enum(["organization", "individual", "alumni", "industry_partner"]).default("organization").optional(),
  contactEmail: emailSchema,
  contactPhone: phoneSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createBudgetSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  category: z.enum(["annual", "semester", "activity", "event", "equipment", "travel", "marketing"]),
  allocatedAmount: z.number().int().positive("Allocated amount must be positive"),
});

export const submitExpenseSchema = z.object({
  budgetId: uuidSchema,
  title: z.string().min(2, "Title must be at least 2 characters").max(150),
  amount: z.number().int().positive("Expense amount must be positive"),
  category: z.string().min(2).max(50),
  vendor: z.string().max(100).optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type CreateSponsorInput = z.infer<typeof createSponsorSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type SubmitExpenseInput = z.infer<typeof submitExpenseSchema>;

export class FinanceValidator {
  public static async validateCreateSponsor(data: unknown): Promise<CreateSponsorInput> {
    return createSponsorSchema.parseAsync(data);
  }

  public static async validateCreateBudget(data: unknown): Promise<CreateBudgetInput> {
    return createBudgetSchema.parseAsync(data);
  }

  public static async validateSubmitExpense(data: unknown): Promise<SubmitExpenseInput> {
    return submitExpenseSchema.parseAsync(data);
  }
}
