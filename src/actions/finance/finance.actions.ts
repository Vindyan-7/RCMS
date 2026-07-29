"use server";

/**
 * Finance Domain - Server Actions Implementation
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { SponsorSelect, BudgetSelect, ExpenseSelect, FinancialTransactionSelect } from "@/db/schema";
import { SponsorsRepository, BudgetsRepository, ExpensesRepository, FinancialTransactionsRepository } from "@/repositories/finance";
import { FinanceService } from "@/services/finance";
import { FinanceValidator } from "@/validation/finance";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";

const sponsorsRepo = new SponsorsRepository();
const budgetsRepo = new BudgetsRepository();
const expensesRepo = new ExpensesRepository();
const transactionsRepo = new FinancialTransactionsRepository();
const financeService = new FinanceService(sponsorsRepo, budgetsRepo, expensesRepo, transactionsRepo);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.FINANCE_VIEW],
  };
}

export async function createSponsorAction(
  rawInput: unknown
): Promise<ApiResponse<SponsorSelect>> {
  logger.info("[Action: createSponsorAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_MANAGE);

    const validatedInput = await FinanceValidator.validateCreateSponsor(rawInput);
    const sponsor = await financeService.createSponsor(validatedInput, actor.id);

    logger.info("[Action: createSponsorAction] Action completed successfully", { id: sponsor.id });

    return {
      success: true,
      data: sponsor,
    };
  } catch (error) {
    logger.error("[Action: createSponsorAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function createBudgetAction(
  rawInput: unknown
): Promise<ApiResponse<BudgetSelect>> {
  logger.info("[Action: createBudgetAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_MANAGE);

    const validatedInput = await FinanceValidator.validateCreateBudget(rawInput);
    const budget = await financeService.createBudget(validatedInput, actor.id);

    logger.info("[Action: createBudgetAction] Action completed successfully", { id: budget.id });

    return {
      success: true,
      data: budget,
    };
  } catch (error) {
    logger.error("[Action: createBudgetAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function submitExpenseAction(
  rawInput: unknown
): Promise<ApiResponse<ExpenseSelect>> {
  logger.info("[Action: submitExpenseAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_MANAGE);

    const validatedInput = await FinanceValidator.validateSubmitExpense(rawInput);
    const expense = await financeService.submitExpense(
      {
        ...validatedInput,
        submittedBy: actor.id,
      },
      actor.id
    );

    return {
      success: true,
      data: expense,
    };
  } catch (error) {
    logger.error("[Action: submitExpenseAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function approveExpenseAction(
  expenseId: string
): Promise<ApiResponse<ExpenseSelect>> {
  logger.info("[Action: approveExpenseAction] Initiating action execution", { expenseId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_MANAGE);

    const expense = await financeService.approveExpense(expenseId, actor.id);

    return {
      success: true,
      data: expense,
    };
  } catch (error) {
    logger.error("[Action: approveExpenseAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function payExpenseAction(
  expenseId: string
): Promise<ApiResponse<{ expense: ExpenseSelect; transaction: FinancialTransactionSelect }>> {
  logger.info("[Action: payExpenseAction] Initiating action execution", { expenseId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_MANAGE);

    const result = await financeService.payExpense(expenseId, actor.id);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("[Action: payExpenseAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getFinancialSummaryAction(): Promise<
  ApiResponse<{ totalIncome: number; totalExpense: number; netBalance: number }>
> {
  logger.debug("[Action: getFinancialSummaryAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_VIEW);

    const summary = await financeService.getFinancialSummary();

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    logger.error("[Action: getFinancialSummaryAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getSponsorsAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<SponsorSelect>>> {
  logger.debug("[Action: getSponsorsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_VIEW);

    const sponsorsList = await financeService.getAllSponsors(pagination || {});

    return {
      success: true,
      data: sponsorsList,
    };
  } catch (error) {
    logger.error("[Action: getSponsorsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getBudgetsAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<BudgetSelect>>> {
  logger.debug("[Action: getBudgetsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_VIEW);

    const budgets = await financeService.getAllBudgets(pagination || {});

    return {
      success: true,
      data: budgets,
    };
  } catch (error) {
    logger.error("[Action: getBudgetsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getExpensesAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<ExpenseSelect>>> {
  logger.debug("[Action: getExpensesAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.FINANCE_VIEW);

    const expensesList = await financeService.getAllExpenses(pagination || {});

    return {
      success: true,
      data: expensesList,
    };
  } catch (error) {
    logger.error("[Action: getExpensesAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
