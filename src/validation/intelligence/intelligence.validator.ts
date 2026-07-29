/**
 * Intelligence Domain - Intelligence Validator Implementation
 */

import { z } from "zod";

export const universalSearchSchema = z.object({
  query: z.string().min(1, "Search query text is required").max(100),
});

export type UniversalSearchInput = z.infer<typeof universalSearchSchema>;

export class IntelligenceValidator {
  public static async validateSearch(data: unknown): Promise<UniversalSearchInput> {
    return universalSearchSchema.parseAsync(data);
  }
}
