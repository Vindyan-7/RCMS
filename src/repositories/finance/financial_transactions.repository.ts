/**
 * Finance Domain - Financial Transactions Repository Implementation
 */

import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { financialTransactions, FinancialTransactionSelect, FinancialTransactionInsert } from "@/db/schema";
import { PaginatedResult } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class FinancialTransactionsRepository {
  public async create(data: FinancialTransactionInsert): Promise<FinancialTransactionSelect> {
    const result = await db.insert(financialTransactions).values(data).returning();
    return result[0];
  }

  public async findById(id: UUID): Promise<FinancialTransactionSelect | null> {
    const result = await db
      .select()
      .from(financialTransactions)
      .where(eq(financialTransactions.id, id))
      .limit(1);

    return result[0] || null;
  }

  public async getSummary(): Promise<{ totalIncome: number; totalExpense: number; netBalance: number }> {
    const incomeRes = await db
      .select({ total: sql<number>`COALESCE(SUM(${financialTransactions.amount}), 0)` })
      .from(financialTransactions)
      .where(eq(financialTransactions.type, "income"));

    const expenseRes = await db
      .select({ total: sql<number>`COALESCE(SUM(${financialTransactions.amount}), 0)` })
      .from(financialTransactions)
      .where(eq(financialTransactions.type, "expense"));

    const totalIncome = Number(incomeRes[0]?.total || 0);
    const totalExpense = Number(expenseRes[0]?.total || 0);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }

  public async findAll(query: PaginationQuery): Promise<PaginatedResult<FinancialTransactionSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(financialTransactions)
        .orderBy(desc(financialTransactions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(financialTransactions),
    ]);

    const total = Number(totalRes[0]?.count || 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
