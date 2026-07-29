import {
  getBudgetsAction,
  getFinancialSummaryAction,
  getExpensesAction,
  getSponsorsAction,
} from "@/actions/finance";
import { FinanceClient } from "@/components/finance/finance-client";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [budgetsRes, summaryRes, expensesRes, sponsorsRes] = await Promise.all([
    getBudgetsAction(),
    getFinancialSummaryAction(),
    getExpensesAction(),
    getSponsorsAction(),
  ]);

  const budgets = budgetsRes.data?.items || [];
  const expenses = expensesRes.data?.items || [];
  const sponsors = sponsorsRes.data?.items || [];
  const summary = summaryRes.data || { totalIncome: 0, totalExpense: 0, netBalance: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Finance & Sponsorship Management Platform
        </h1>
        <p className="text-sm text-muted-foreground">
          Sponsorship CRM partners, budget pool allocations, multi-stage expense pipeline, and treasury balance monitoring
        </p>
      </div>

      <FinanceClient
        initialBudgets={budgets}
        initialExpenses={expenses}
        initialSponsors={sponsors}
        initialSummary={summary}
      />
    </div>
  );
}
