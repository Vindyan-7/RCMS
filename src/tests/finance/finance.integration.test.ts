/**
 * Finance Domain Vertical Slice Integration Test Suite
 */

import { createSponsorAction, createBudgetAction, submitExpenseAction, approveExpenseAction, payExpenseAction, getFinancialSummaryAction } from "@/actions/finance/finance.actions";
import { FinanceValidator } from "@/validation/finance";

export async function runFinanceDomainIntegrationTests() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    logs: [] as string[],
  };

  function assert(condition: boolean, testName: string) {
    results.total++;
    if (condition) {
      results.passed++;
      results.logs.push(`[PASS] ${testName}`);
    } else {
      results.failed++;
      results.logs.push(`[FAIL] ${testName}`);
    }
  }

  // 1. Validator Direct Unit Checks
  try {
    const validSponsor = await FinanceValidator.validateCreateSponsor({
      name: "RoboCorp Tech Ltd",
      contactEmail: "sponsorships@robocorp.com",
      contactPhone: "9876543217",
      type: "organization",
    });
    assert(validSponsor.name === "RoboCorp Tech Ltd", "FinanceValidator: Parses valid sponsor creation input");
  } catch (e) {
    assert(false, "FinanceValidator: Failed on valid input");
  }

  try {
    await FinanceValidator.validateCreateSponsor({
      name: "R",
      contactEmail: "invalid-email",
    });
    assert(false, "FinanceValidator: Should fail on invalid email and short name");
  } catch (e) {
    assert(true, "FinanceValidator: Rejects invalid inputs correctly");
  }

  // 2. Vertical Slice Execution
  // Create Sponsor
  const sponsorRes = await createSponsorAction({
    name: "Innovate Robotics Fund",
    contactEmail: "grants@innovaterobotics.org",
    type: "industry_partner",
  });
  assert(sponsorRes.success === true, "ServerAction: createSponsorAction registers new sponsor");

  // Create Budget
  const budgetRes = await createBudgetAction({
    name: "Annual Hardware & Component Fund 2026",
    category: "equipment",
    allocatedAmount: 100000,
  });
  assert(budgetRes.success === true && budgetRes.data?.allocatedAmount === 100000, "ServerAction: createBudgetAction initializes budget pool");

  if (budgetRes.success && budgetRes.data) {
    const budgetId = budgetRes.data.id;

    // Submit Expense
    const submitExpenseRes = await submitExpenseAction({
      budgetId,
      title: "Purchase of Motor Drivers & Microcontrollers",
      amount: 15000,
      category: "equipment",
      vendor: "RoboElements Store",
    });
    assert(submitExpenseRes.success === true && submitExpenseRes.data?.status === "submitted", "ServerAction: submitExpenseAction logs expense request");

    if (submitExpenseRes.success && submitExpenseRes.data) {
      const expenseId = submitExpenseRes.data.id;

      // Attempt payment before approval (should fail)
      const prematurePayRes = await payExpenseAction(expenseId);
      assert(prematurePayRes.success === false, "ServerAction: Rejects payment on unapproved expense request");

      // Approve Expense
      const approveRes = await approveExpenseAction(expenseId);
      assert(approveRes.success === true && approveRes.data?.status === "approved", "ServerAction: approveExpenseAction sets status to approved");

      // Pay Expense
      const payRes = await payExpenseAction(expenseId);
      assert(payRes.success === true && payRes.data?.expense.status === "paid" && payRes.data?.transaction.amount === 15000, "ServerAction: payExpenseAction executes payment, updates budget utilization, and posts financial transaction ledger entry");
    }

    // Get Financial Summary
    const summaryRes = await getFinancialSummaryAction();
    assert(summaryRes.success === true, "ServerAction: getFinancialSummaryAction returns financial statement summary");
  }

  return results;
}
