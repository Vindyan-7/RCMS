/**
 * Intelligence Layer Vertical Slice Integration Test Suite
 */

import { getExecutiveDashboardMetricsAction, getKpiMetricsAction, universalSearchAction, getSystemInsightsAction } from "@/actions/intelligence/intelligence.actions";
import { registerMemberAction } from "@/actions/members";

export async function runIntelligenceDomainIntegrationTests() {
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

  // Pre-requisite data seed
  await registerMemberAction({
    name: "Intelligence Test Member",
    email: "intel.member@robotics.org",
    phone: "9876543219",
    rollNumber: "26RC1010",
  });

  // 1. Executive Dashboard Aggregation Action
  const dashboardRes = await getExecutiveDashboardMetricsAction();
  assert(dashboardRes.success === true && dashboardRes.data !== undefined, "ServerAction: getExecutiveDashboardMetricsAction aggregates system metrics");

  // 2. Centralized KPI Engine Action
  const kpiRes = await getKpiMetricsAction();
  assert(kpiRes.success === true && kpiRes.data?.memberActiveRatioPct !== undefined, "ServerAction: getKpiMetricsAction calculates central KPIs");

  // 3. Universal Search Engine Action
  const searchRes = await universalSearchAction({ query: "Intelligence" });
  assert(searchRes.success === true && searchRes.data?.length > 0, "ServerAction: universalSearchAction performs cross-domain fuzzy search");

  // 4. Automated Insights Engine Action
  const insightsRes = await getSystemInsightsAction();
  assert(insightsRes.success === true && Array.isArray(insightsRes.data), "ServerAction: getSystemInsightsAction evaluates system-wide automated insights");

  return results;
}
