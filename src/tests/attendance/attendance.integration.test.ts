/**
 * Attendance Domain Vertical Slice Integration Test Suite
 */

import { createAttendanceSessionAction, openAttendanceSessionAction, pauseAttendanceSessionAction, closeAttendanceSessionAction, lockAttendanceSessionAction } from "@/actions/attendance/attendance_sessions.actions";
import { generateVolunteerCodeAction, validateVolunteerCodeAction } from "@/actions/attendance/volunteer_codes.actions";
import { recordAttendanceAction, getSessionRecordsAction, getMemberAttendanceRecordsAction } from "@/actions/attendance/attendance_records.actions";
import { registerMemberAction } from "@/actions/members";
import { AttendanceSessionsValidator, AttendanceRecordsValidator, VolunteerCodesValidator } from "@/validation/attendance";

export async function runAttendanceDomainIntegrationTests() {
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

  // 1. Attendance Validator Unit Checks
  try {
    const validSession = await AttendanceSessionsValidator.validateCreate({
      title: "Robotics Orientation Workshop",
      date: "2026-08-01",
      startTime: "10:00:00",
      endTime: "12:00:00",
      attendancePoints: 10,
    });
    assert(validSession.title === "Robotics Orientation Workshop", "AttendanceSessionsValidator: Parses valid session input");
  } catch (e) {
    assert(false, "AttendanceSessionsValidator: Failed on valid input");
  }

  try {
    await AttendanceSessionsValidator.validateCreate({
      title: "R",
      date: "invalid-date",
      startTime: "99:99",
      endTime: "99:99",
    });
    assert(false, "AttendanceSessionsValidator: Should fail on invalid input");
  } catch (e) {
    assert(true, "AttendanceSessionsValidator: Rejects invalid inputs correctly");
  }

  // 2. Integration Vertical Slice Execution
  // Register a test member first
  const memberReg = await registerMemberAction({
    name: "Bob Builder",
    email: "bob.builder@robotics.org",
    phone: "9876543211",
    rollNumber: "26RC1003",
  });

  assert(memberReg.success === true, "Pre-requisite: Member registration succeeds");

  if (memberReg.success && memberReg.data) {
    const memberId = memberReg.data.id;

    // Create session
    const createSessionRes = await createAttendanceSessionAction({
      title: "Autonomous Navigation Lab",
      date: "2026-08-10",
      startTime: "14:00:00",
      endTime: "16:00:00",
      attendancePoints: 15,
    });

    assert(createSessionRes.success === true, "ServerAction: createAttendanceSessionAction succeeds");

    if (createSessionRes.success && createSessionRes.data) {
      const sessionId = createSessionRes.data.id;

      // Attempt attendance scan while session is in 'draft' status (should fail with SESSION_CLOSED)
      const earlyScanRes = await recordAttendanceAction({
        memberId,
        sessionId,
      });
      assert(earlyScanRes.success === false && earlyScanRes.error?.code === "SESSION_CLOSED", "ServerAction: Rejects scan on non-active session");

      // Open session
      const openRes = await openAttendanceSessionAction(sessionId);
      assert(openRes.success === true && openRes.data?.status === "active", "ServerAction: openAttendanceSessionAction sets status to active");

      // Generate volunteer code PIN
      const pinRes = await generateVolunteerCodeAction({ sessionId, expirationHours: 2 });
      assert(pinRes.success === true && pinRes.data?.code.length === 6, "ServerAction: generateVolunteerCodeAction returns 6-digit PIN");

      if (pinRes.success && pinRes.data) {
        const pinCode = pinRes.data.code;
        const validatePinRes = await validateVolunteerCodeAction({ code: pinCode });
        assert(validatePinRes.success === true && validatePinRes.data?.status === "active", "ServerAction: validateVolunteerCodeAction activates scanner PIN");
      }

      // Record valid attendance check-in
      const scanRes = await recordAttendanceAction({
        memberId,
        sessionId,
        method: "qr",
      });
      assert(scanRes.success === true && scanRes.data?.points === 15, "ServerAction: recordAttendanceAction records QR check-in and awards points");

      // Attempt duplicate attendance check-in (should fail with ATTENDANCE_ALREADY_MARKED)
      const duplicateScanRes = await recordAttendanceAction({
        memberId,
        sessionId,
      });
      assert(duplicateScanRes.success === false && duplicateScanRes.error?.code === "ATTENDANCE_ALREADY_MARKED", "ServerAction: Rejects duplicate attendance check-in with ATTENDANCE_ALREADY_MARKED");

      // Query session records & member records
      const sessionRecordsRes = await getSessionRecordsAction(sessionId);
      assert(sessionRecordsRes.success === true && sessionRecordsRes.data?.items.length > 0, "ServerAction: getSessionRecordsAction lists check-ins");

      const memberRecordsRes = await getMemberAttendanceRecordsAction(memberId);
      assert(memberRecordsRes.success === true && memberRecordsRes.data?.items.length > 0, "ServerAction: getMemberAttendanceRecordsAction lists member history");

      // Pause, Close, Lock session transitions
      const pauseRes = await pauseAttendanceSessionAction(sessionId);
      assert(pauseRes.success === true && pauseRes.data?.status === "paused", "ServerAction: pauseAttendanceSessionAction updates status to paused");

      const closeRes = await closeAttendanceSessionAction(sessionId);
      assert(closeRes.success === true && closeRes.data?.status === "closed", "ServerAction: closeAttendanceSessionAction updates status to closed");

      const lockRes = await lockAttendanceSessionAction(sessionId);
      assert(lockRes.success === true && lockRes.data?.status === "archived", "ServerAction: lockAttendanceSessionAction updates status to archived");
    }
  }

  return results;
}
