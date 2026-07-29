/**
 * Members Domain Vertical Slice Integration Test Suite
 */

import { registerMemberAction, updateMemberAction, archiveMemberAction, restoreMemberAction, getMemberAction, searchMembersAction, createMembershipAction, activateMembershipAction, suspendMembershipAction, closeMembershipAction, getActiveMembershipAction, getMembershipHistoryAction } from "@/actions/members";
import { MemberValidator, MembershipValidator } from "@/validation/members";
import { MembersService, MembershipsService } from "@/services/members";
import { MembersRepository, MembershipsRepository } from "@/repositories/members";

export async function runMembersDomainIntegrationTests() {
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

  // 1. Validator Layer Direct Unit Checks
  try {
    const validMember = await MemberValidator.validateCreate({
      name: "John Doe",
      email: "john.doe@test.com",
      phone: "9876543210",
      rollNumber: "26RC1001",
    });
    assert(validMember.name === "John Doe", "MemberValidator: Parses valid registration input");
  } catch (e) {
    assert(false, "MemberValidator: Failed on valid input");
  }

  try {
    await MemberValidator.validateCreate({
      name: "J",
      email: "invalid-email",
      phone: "123",
      rollNumber: "1",
    });
    assert(false, "MemberValidator: Should fail on invalid inputs");
  } catch (e) {
    assert(true, "MemberValidator: Rejects invalid inputs correctly");
  }

  // 2. Server Action Interface Integration Checks
  const mockMemberInput = {
    name: "Alice Smith",
    email: "alice.smith@university.edu",
    phone: "9123456789",
    rollNumber: "26RC1002",
  };

  const registerResult = await registerMemberAction(mockMemberInput);
  assert(registerResult.success === true, "ServerAction: registerMemberAction completes successfully");

  if (registerResult.success && registerResult.data) {
    const memberId = registerResult.data.id;

    // Test get member profile
    const getResult = await getMemberAction(memberId);
    assert(getResult.success === true && getResult.data?.member.email === mockMemberInput.email, "ServerAction: getMemberAction retrieves profile");

    // Test duplicate registration error (ConflictError)
    const duplicateResult = await registerMemberAction(mockMemberInput);
    assert(duplicateResult.success === false && duplicateResult.error?.code === "MEMBER_ALREADY_EXISTS", "ServerAction: Rejects duplicate roll number / email with MEMBER_ALREADY_EXISTS error");

    // Test update member
    const updateResult = await updateMemberAction(memberId, { name: "Alice J. Smith" });
    assert(updateResult.success === true && updateResult.data?.name === "Alice J. Smith", "ServerAction: updateMemberAction modifies name");

    // Test member search
    const searchResult = await searchMembersAction("Alice");
    assert(searchResult.success === true && searchResult.data?.items.length > 0, "ServerAction: searchMembersAction returns matching records");

    // Test archiving & restoration
    const archiveResult = await archiveMemberAction(memberId);
    assert(archiveResult.success === true && archiveResult.data?.archived === true, "ServerAction: archiveMemberAction soft-deletes member");

    const restoreResult = await restoreMemberAction(memberId);
    assert(restoreResult.success === true && restoreResult.data?.restored === true, "ServerAction: restoreMemberAction restores soft-deleted member");

    // 3. Membership Server Actions Integration
    const mockMembershipInput = {
      memberId: memberId,
      academicYearId: "11111111-1111-1111-1111-111111111111",
      semesterId: "22222222-2222-2222-2222-222222222222",
    };

    const createMemResult = await createMembershipAction(mockMembershipInput);
    assert(createMemResult.success === true, "ServerAction: createMembershipAction creates term enrollment");

    if (createMemResult.success && createMemResult.data) {
      const membershipId = createMemResult.data.id;

      // Test active membership query
      const activeResult = await getActiveMembershipAction(memberId);
      assert(activeResult.success === true && activeResult.data?.id === membershipId, "ServerAction: getActiveMembershipAction returns current active membership");

      // Test status transitions (suspend, activate, close)
      const suspendResult = await suspendMembershipAction(membershipId);
      assert(suspendResult.success === true && suspendResult.data?.status === "suspended", "ServerAction: suspendMembershipAction updates status to suspended");

      const activateResult = await activateMembershipAction(membershipId);
      assert(activateResult.success === true && activateResult.data?.status === "active", "ServerAction: activateMembershipAction updates status to active");

      const closeResult = await closeMembershipAction(membershipId);
      assert(closeResult.success === true && closeResult.data?.status === "inactive" && closeResult.data?.exitDate !== null, "ServerAction: closeMembershipAction closes term and sets exit_date");

      // Test membership history
      const historyResult = await getMembershipHistoryAction(memberId);
      assert(historyResult.success === true && historyResult.data?.length > 0, "ServerAction: getMembershipHistoryAction returns enrollment array");
    }
  }

  return results;
}
