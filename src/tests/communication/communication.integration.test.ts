/**
 * Communication Domain Vertical Slice Integration Test Suite
 */

import { sendNotificationAction, broadcastNotificationAction, markNotificationAsReadAction, getMemberNotificationsAction, createNotificationTemplateAction } from "@/actions/communication/communication.actions";
import { registerMemberAction } from "@/actions/members";
import { CommunicationValidator } from "@/validation/communication";

export async function runCommunicationDomainIntegrationTests() {
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
    const validSend = await CommunicationValidator.validateSend({
      recipientId: "00000000-0000-0000-0000-000000000001",
      title: "Welcome to Robotics Club",
      message: "Your membership application has been approved.",
      channel: "in_app",
    });
    assert(validSend.title === "Welcome to Robotics Club", "CommunicationValidator: Parses valid send notification input");
  } catch (e) {
    assert(false, "CommunicationValidator: Failed on valid input");
  }

  try {
    await CommunicationValidator.validateSend({
      recipientId: "invalid-uuid",
      title: "W",
      message: "",
    });
    assert(false, "CommunicationValidator: Should fail on empty message and short title");
  } catch (e) {
    assert(true, "CommunicationValidator: Rejects invalid inputs correctly");
  }

  // 2. Vertical Slice Execution
  // Register two test members for broadcasting tests
  const member1 = await registerMemberAction({
    name: "Eve Communicator",
    email: "eve.communicator@robotics.org",
    phone: "9876543214",
    rollNumber: "26RC1006",
  });
  const member2 = await registerMemberAction({
    name: "Frank Receiver",
    email: "frank.receiver@robotics.org",
    phone: "9876543215",
    rollNumber: "26RC1007",
  });

  assert(member1.success && member2.success, "Pre-requisite: Member registrations succeed");

  if (member1.success && member1.data && member2.success && member2.data) {
    const m1Id = member1.data.id;
    const m2Id = member2.data.id;

    // Send single notification
    const sendRes = await sendNotificationAction({
      recipientId: m1Id,
      title: "Orientation Meeting",
      message: "Please join the orientation meeting today at 4 PM in Lab 3.",
      channel: "in_app",
      priority: "high",
    });
    assert(sendRes.success === true && sendRes.data?.title === "Orientation Meeting", "ServerAction: sendNotificationAction creates notification entry");

    if (sendRes.success && sendRes.data) {
      const notifId = sendRes.data.id;

      // Mark notification as read
      const markReadRes = await markNotificationAsReadAction(notifId);
      assert(markReadRes.success === true && markReadRes.data?.read === true, "ServerAction: markNotificationAsReadAction updates read flag to true");
    }

    // Broadcast Notification to multiple recipients
    const broadcastRes = await broadcastNotificationAction({
      recipientIds: [m1Id, m2Id],
      title: "Annual Hackathon Announced",
      message: "Registration for RoboHacks 2026 is now open!",
    });
    assert(broadcastRes.success === true && broadcastRes.data?.length === 2, "ServerAction: broadcastNotificationAction dispatches batch notifications");

    // Fetch recipient notifications
    const getListRes = await getMemberNotificationsAction(m1Id);
    assert(getListRes.success === true && getListRes.data?.items.length >= 2, "ServerAction: getMemberNotificationsAction returns member notification list");

    // Create Notification Template
    const templateRes = await createNotificationTemplateAction({
      code: "event_reminder_v1",
      name: "Event Reminder Template",
      subject: "Reminder: {{eventName}} starts soon",
      templateText: "Hello {{memberName}}, this is a reminder for {{eventName}} scheduled at {{time}}.",
      channel: "email",
    });
    assert(templateRes.success === true && templateRes.data?.code === "event_reminder_v1", "ServerAction: createNotificationTemplateAction creates reusable template");
  }

  return results;
}
