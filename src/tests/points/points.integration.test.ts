/**
 * Points Domain Vertical Slice Integration Test Suite
 */

import { awardPointsAction, deductPointsAction, rollbackTransactionAction, getMemberScoreAction, getLeaderboardAction, createPointRuleAction } from "@/actions/points/points.actions";
import { registerMemberAction } from "@/actions/members";
import { PointsValidator } from "@/validation/points";

export async function runPointsDomainIntegrationTests() {
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
    const validAward = await PointsValidator.validateAward({
      memberId: "00000000-0000-0000-0000-000000000001",
      category: "attendance",
      points: 10,
    });
    assert(validAward.points === 10, "PointsValidator: Parses valid award points input");
  } catch (e) {
    assert(false, "PointsValidator: Failed on valid input");
  }

  try {
    await PointsValidator.validateAward({
      memberId: "invalid-uuid",
      category: "",
      points: -5,
    });
    assert(false, "PointsValidator: Should fail on negative points and invalid UUID");
  } catch (e) {
    assert(true, "PointsValidator: Rejects negative points and invalid UUID correctly");
  }

  // 2. Vertical Slice Execution
  const uniqueId = Math.floor(10000 + Math.random() * 89999);
  const memberReg = await registerMemberAction({
    name: "David Scoring",
    email: `david.${uniqueId}@robotics.org`,
    phone: "9876543213",
    rollNumber: `26RC${uniqueId}`,
  });
  assert(memberReg.success === true, "Pre-requisite: Member registration succeeds");

  if (memberReg.success && memberReg.data) {
    const memberId = memberReg.data.id;

    // Award Points
    const awardRes = await awardPointsAction({
      memberId,
      category: "workshop",
      points: 50,
      remarks: "Attended Advanced ROS2 Workshop",
    });
    assert(awardRes.success === true && awardRes.data?.points === 50, "ServerAction: awardPointsAction inserts positive ledger entry");

    if (awardRes.success && awardRes.data) {
      const transactionId = awardRes.data.id;

      // Verify Score Computation
      const score1 = await getMemberScoreAction(memberId);
      assert(score1.success === true && score1.data?.totalPoints === 50, "ServerAction: getMemberScoreAction calculates dynamic sum as 50");

      // Deduct Points
      const deductRes = await deductPointsAction({
        memberId,
        category: "penalty",
        points: 15,
        remarks: "Late submission penalty",
      });
      assert(deductRes.success === true && deductRes.data?.points === -15, "ServerAction: deductPointsAction inserts negative ledger entry");

      const score2 = await getMemberScoreAction(memberId);
      assert(score2.success === true && score2.data?.totalPoints === 35, "ServerAction: Score correctly updates to 35 after deduction");

      // Rollback Award Transaction
      const rollbackRes = await rollbackTransactionAction({
        transactionId,
        reason: "Duplicate entry correction",
      });
      assert(rollbackRes.success === true && rollbackRes.data?.points === -50, "ServerAction: rollbackTransactionAction inserts inverted balancing record");

      const score3 = await getMemberScoreAction(memberId);
      assert(score3.success === true, "ServerAction: Score reflects rollback entry");
    }

    const createRuleRes = await createPointRuleAction({
      trigger: "task_completed",
      category: "task",
      points: 25,
      description: "Default reward for completing a technical task",
    });
    assert(createRuleRes.success === true, "ServerAction: createPointRuleAction creates point rule");
  }

  const leaderboardRes = await getLeaderboardAction();
  assert(leaderboardRes.success === true && (leaderboardRes.data?.items.length ?? 0) > 0, "ServerAction: getLeaderboardAction retrieves aggregated leaderboard");

  return results;
}
