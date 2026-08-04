import { supabase } from "@/db";
import { logger } from "@/core/logger";

export interface FinanceSummaryData {
  totalBudget: number;
  totalExpenses: number;
  totalSponsorships: number;
  netBalance: number;
  rows: Array<{
    category: string;
    allocated: number;
    spent: number;
    remaining: number;
    status: "Within Budget" | "Near Limit" | "Exceeded";
  }>;
}

export class FinanceSummaryReportService {

  /**
   * 6. Finance Summary Report (Placeholder Architecture)
   */
  public async getFinanceSummaryReport(): Promise<FinanceSummaryData> {
    logger.info("[FinanceSummaryReportService] Generating Finance Summary Report");

    return {
      totalBudget: 150000,
      totalExpenses: 84500,
      totalSponsorships: 60000,
      netBalance: 125500,
      rows: [
        { category: "Robotics Hardware & Components", allocated: 60000, spent: 42000, remaining: 18000, status: "Within Budget" },
        { category: "Events & State Competition", allocated: 50000, spent: 28500, remaining: 21500, status: "Within Budget" },
        { category: "Workshops & Training Materials", allocated: 25000, spent: 11000, remaining: 14000, status: "Within Budget" },
        { category: "Miscellaneous & Admin", allocated: 15000, spent: 3000, remaining: 12000, status: "Within Budget" },
      ],
    };
  }
}
