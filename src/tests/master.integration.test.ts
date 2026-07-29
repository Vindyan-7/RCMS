/**
 * Master Cross-Domain Regression Integration Test Suite
 * Executes full vertical slice verification for RCMS v1.0 Release Candidate
 */

import { runMembersDomainIntegrationTests } from "./members/members.integration.test";
import { runAttendanceDomainIntegrationTests } from "./attendance/attendance.integration.test";
import { runOperationsDomainIntegrationTests } from "./operations/operations.integration.test";
import { runPointsDomainIntegrationTests } from "./points/points.integration.test";
import { runCommunicationDomainIntegrationTests } from "./communication/communication.integration.test";
import { runInventoryDomainIntegrationTests } from "./inventory/inventory.integration.test";
import { runFinanceDomainIntegrationTests } from "./finance/finance.integration.test";
import { runIntelligenceDomainIntegrationTests } from "./intelligence/intelligence.integration.test";

export async function runFullMasterRegressionSuite() {
  const masterResults = {
    total: 0,
    passed: 0,
    failed: 0,
    suiteDetails: {} as Record<string, { total: number; passed: number; failed: number }>,
  };

  const suites = [
    { name: "Members Domain", runner: runMembersDomainIntegrationTests },
    { name: "Attendance Domain", runner: runAttendanceDomainIntegrationTests },
    { name: "Operations Domain", runner: runOperationsDomainIntegrationTests },
    { name: "Points Engine", runner: runPointsDomainIntegrationTests },
    { name: "Communication Hub", runner: runCommunicationDomainIntegrationTests },
    { name: "Inventory Domain", runner: runInventoryDomainIntegrationTests },
    { name: "Finance Platform", runner: runFinanceDomainIntegrationTests },
    { name: "Intelligence Layer", runner: runIntelligenceDomainIntegrationTests },
  ];

  for (const suite of suites) {
    const res = await suite.runner();
    masterResults.total += res.total;
    masterResults.passed += res.passed;
    masterResults.failed += res.failed;
    masterResults.suiteDetails[suite.name] = {
      total: res.total,
      passed: res.passed,
      failed: res.failed,
    };
  }

  return masterResults;
}
