/**
 * Finance Domain - Finance Service Implementation
 */

import { SponsorsRepository } from "@/repositories/finance/sponsors.repository";
import { BudgetsRepository } from "@/repositories/finance/budgets.repository";
import { ExpensesRepository } from "@/repositories/finance/expenses.repository";
import { FinancialTransactionsRepository } from "@/repositories/finance/financial_transactions.repository";
import { SponsorSelect, SponsorInsert, BudgetSelect, BudgetInsert, ExpenseSelect, ExpenseInsert, FinancialTransactionSelect } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { NotFoundError, BadRequestError } from "@/core/errors";
import { logger } from "@/core/logger";

export class FinanceService {
  constructor(
    private readonly sponsorsRepo: SponsorsRepository,
    private readonly budgetsRepo: BudgetsRepository,
    private readonly expensesRepo: ExpensesRepository,
    private readonly transactionsRepo: FinancialTransactionsRepository
  ) {}

  public async createSponsor(
    data: any,
    actorId: UUID
  ): Promise<SponsorSelect> {
    logger.info("[FinanceService] Registering new sponsor", { name: data.name, actorId });
    return this.sponsorsRepo.create(data, actorId);
  }

  public async createBudget(
    data: any,
    actorId: UUID
  ): Promise<BudgetSelect> {
    logger.info("[FinanceService] Creating budget allocation", { name: data.name, amount: data.allocatedAmount, actorId });
    return this.budgetsRepo.create(data, actorId);
  }

  public async submitExpense(
    data: any,
    actorId: UUID
  ): Promise<ExpenseSelect> {
    logger.info("[FinanceService] Submitting expense request", { title: data.title, amount: data.amount, actorId });

    const budget = await this.budgetsRepo.findById(data.budgetId);
    if (!budget) {
      throw new NotFoundError(`Budget ${data.budgetId} not found`);
    }

    return this.expensesRepo.create(
      {
        ...data,
        status: "submitted",
        submittedBy: actorId,
      },
      actorId
    );
  }

  public async approveExpense(
    expenseId: UUID,
    actorId: UUID
  ): Promise<ExpenseSelect> {
    logger.info("[FinanceService] Approving expense request", { expenseId, actorId });

    const expense = await this.expensesRepo.findById(expenseId);
    if (!expense) {
      throw new NotFoundError(`Expense ${expenseId} not found`);
    }

    if (expense.status !== "submitted") {
      throw new BadRequestError(`Cannot approve expense in ${expense.status} status`);
    }

    return this.expensesRepo.update(expenseId, { status: "approved" }, actorId);
  }

  public async payExpense(
    expenseId: UUID,
    actorId: UUID
  ): Promise<{ expense: ExpenseSelect; transaction: FinancialTransactionSelect }> {
    logger.info("[FinanceService] Executing expense payment & ledger posting", { expenseId, actorId });

    const expense = await this.expensesRepo.findById(expenseId);
    if (!expense) {
      throw new NotFoundError(`Expense ${expenseId} not found`);
    }

    if (expense.status !== "approved") {
      throw new BadRequestError(`Expense ${expenseId} must be approved before payment`);
    }

    // Update expense status
    const updatedExpense = await this.expensesRepo.update(expenseId, { status: "paid" }, actorId);

    // Update budget utilized amount
    await this.budgetsRepo.updateUtilizedAmount(expense.budgetId, expense.amount, actorId);

    // Post immutable financial ledger entry
    const transaction = await this.transactionsRepo.create({
      type: "expense",
      amount: expense.amount,
      referenceType: "expenses",
      referenceId: expenseId,
      createdBy: actorId,
      remarks: `Paid expense ${expenseId}: ${expense.title}`,
    });

    return {
      expense: updatedExpense,
      transaction,
    };
  }

  public async getFinancialSummary(): Promise<{
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  }> {
    return this.transactionsRepo.getSummary();
  }

  public async getAllSponsors(query: PaginationQuery): Promise<PaginatedResult<SponsorSelect>> {
    return this.sponsorsRepo.findAll(query);
  }

  public async getAllBudgets(query: PaginationQuery): Promise<PaginatedResult<BudgetSelect>> {
    return this.budgetsRepo.findAll(query);
  }

  public async getAllExpenses(query: PaginationQuery): Promise<PaginatedResult<ExpenseSelect>> {
    return this.expensesRepo.findAll(query);
  }
}
