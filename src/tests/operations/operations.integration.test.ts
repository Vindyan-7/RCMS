/**
 * Operations Domain Vertical Slice Integration Test Suite
 */

import { createTaskAction, updateTaskAction, completeTaskAction, getTaskCompletionsAction } from "@/actions/operations/tasks.actions";
import { createEventAction, updateEventAction, verifyEventParticipationAction, getEventParticipationsAction } from "@/actions/operations/events.actions";
import { registerMemberAction } from "@/actions/members";
import { TasksValidator, EventsValidator } from "@/validation/operations";

export async function runOperationsDomainIntegrationTests() {
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
    const validTask = await TasksValidator.validateCreate({
      title: "Assemble Line Follower Chassis",
      points: 15,
    });
    assert(validTask.title === "Assemble Line Follower Chassis", "TasksValidator: Parses valid task creation input");
  } catch (e) {
    assert(false, "TasksValidator: Failed on valid input");
  }

  try {
    const validEvent = await EventsValidator.validateCreate({
      name: "RoboWars 2026",
      startDate: "2026-09-01T10:00:00Z",
      endDate: "2026-09-01T18:00:00Z",
      points: 50,
    });
    assert(validEvent.name === "RoboWars 2026", "EventsValidator: Parses valid event creation input");
  } catch (e) {
    assert(false, "EventsValidator: Failed on valid input");
  }

  // 2. Vertical Slice Execution
  // Register a test member first
  const memberReg = await registerMemberAction({
    name: "Charlie Engineer",
    email: "charlie.engineer@robotics.org",
    phone: "9876543212",
    rollNumber: "26RC1004",
  });
  assert(memberReg.success === true, "Pre-requisite: Member registration succeeds");

  if (memberReg.success && memberReg.data) {
    const memberId = memberReg.data.id;

    // Create & complete Task
    const createTaskRes = await createTaskAction({
      title: "Calibrate Ultrasonic Sensors",
      points: 20,
    });
    assert(createTaskRes.success === true, "ServerAction: createTaskAction succeeds");

    if (createTaskRes.success && createTaskRes.data) {
      const taskId = createTaskRes.data.id;

      const completeTaskRes = await completeTaskAction({ taskId, memberId });
      assert(completeTaskRes.success === true, "ServerAction: completeTaskAction records task completion");

      const duplicateCompleteRes = await completeTaskAction({ taskId, memberId });
      assert(duplicateCompleteRes.success === false, "ServerAction: Rejects duplicate task completion");

      const completionsRes = await getTaskCompletionsAction(taskId);
      assert(completionsRes.success === true && (completionsRes.data?.items?.length || 0) > 0, "ServerAction: getTaskCompletionsAction lists completions");
    }

    // Create & verify Event
    const createEventRes = await createEventAction({
      name: "3D Printing & CAD Workshop",
      startDate: "2026-08-15T09:00:00Z",
      endDate: "2026-08-15T12:00:00Z",
      points: 30,
    });
    assert(createEventRes.success === true, "ServerAction: createEventAction succeeds");

    if (createEventRes.success && createEventRes.data) {
      const eventId = createEventRes.data.id;

      const verifyRes = await verifyEventParticipationAction({ eventId, memberId });
      assert(verifyRes.success === true, "ServerAction: verifyEventParticipationAction verifies member participation");

      const duplicateVerifyRes = await verifyEventParticipationAction({ eventId, memberId });
      assert(duplicateVerifyRes.success === false, "ServerAction: Rejects duplicate event participation verification");

      const participationsRes = await getEventParticipationsAction(eventId);
      assert(participationsRes.success === true && (participationsRes.data?.items?.length || 0) > 0, "ServerAction: getEventParticipationsAction lists event participations");
    }
  }

  return results;
}
