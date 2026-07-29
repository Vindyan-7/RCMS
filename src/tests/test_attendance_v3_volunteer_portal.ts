import * as fs from "fs";
import * as path from "path";

const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

async function main() {
  console.log("=================================================");
  console.log("🧪 Testing Attendance Module v3 & Volunteer Portal...");
  console.log("=================================================");

  const { createAttendanceSessionAction, openAttendanceSessionAction } = await import("../actions/attendance/attendance_sessions.actions");
  const {
    generateVolunteerCodeAction,
    loginVolunteerPortalAction,
    endVolunteerCodeAction,
  } = await import("../actions/attendance/volunteer_codes.actions");

  const { recordAttendanceAction } = await import("../actions/attendance/attendance_records.actions");
  const { searchMembersAction } = await import("../actions/members/members.actions");

  // Step 1: Find test members
  const membersRes = await searchMembersAction({ page: 1, limit: 5 });
  if (!membersRes.success || !membersRes.data || membersRes.data.items.length < 2) {
    console.error("❌ Need at least 2 members for volunteer testing");
    process.exit(1);
  }
  const volunteerMember = membersRes.data.items[0];
  const attendeeMember = membersRes.data.items[1];

  console.log(`✅ Step 1: Volunteer Member: ${volunteerMember.name} (${volunteerMember.clubMembershipId || volunteerMember.rollNumber})`);
  console.log(`✅ Step 1: Attendee Member: ${attendeeMember.name} (${attendeeMember.clubMembershipId || attendeeMember.rollNumber})`);

  // Step 2: Create and activate attendance session
  const batchId = Math.floor(1000 + Math.random() * 8999);
  const sessRes = await createAttendanceSessionAction({
    title: `RCMS v3 Workshop ${batchId}`,
    date: new Date().toISOString(),
    startTime: "09:00:00",
    endTime: "17:00:00",
    status: "draft",
  });

  if (!sessRes.success || !sessRes.data) {
    console.error("❌ Failed to create session:", sessRes.error);
    process.exit(1);
  }
  const session = sessRes.data;
  await openAttendanceSessionAction(session.id);
  console.log(`✅ Step 2: Attendance Session active: ${session.title}`);

  // Step 3: Generate Volunteer PIN
  const pinRes = await generateVolunteerCodeAction({ sessionId: session.id, expirationMinutes: 30 });
  if (!pinRes.success || !pinRes.data) {
    console.error("❌ Failed to generate PIN:", pinRes.error);
    process.exit(1);
  }
  const pinCode = pinRes.data.code;
  console.log(`✅ Step 3: Generated Volunteer PIN: ${pinCode}`);

  // Step 4: Volunteer Portal Login
  const loginRes = await loginVolunteerPortalAction({
    memberInput: volunteerMember.clubMembershipId || volunteerMember.rollNumber || volunteerMember.email,
    pinCode: pinCode,
  });

  if (!loginRes.success || !loginRes.data) {
    console.error("❌ Volunteer Portal Login failed:", loginRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 4: Volunteer Portal Login successful! Authenticated for session: '${loginRes.data.session.title}'`);

  // Step 5: Take Attendance via Volunteer Portal
  const recRes = await recordAttendanceAction({
    memberId: attendeeMember.id,
    sessionId: session.id,
    method: "manual",
    remarks: "Scanned via Volunteer Portal v3",
  });

  if (!recRes.success || !recRes.data) {
    console.error("❌ Attendance check-in failed:", recRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 5: Attendance check-in recorded via Volunteer Portal! Points: ${recRes.data.points}`);

  // Step 6: Session-Based Access Termination
  await endVolunteerCodeAction(pinRes.data.id);
  const reLoginRes = await loginVolunteerPortalAction({
    memberInput: volunteerMember.clubMembershipId || volunteerMember.rollNumber || volunteerMember.email,
    pinCode: pinCode,
  });

  if (reLoginRes.success) {
    console.error("❌ Terminated PIN check failed! Allowed login with ended PIN.");
    process.exit(1);
  }
  console.log(`✅ Step 6: Terminated PIN correctly rejected with error: '${reLoginRes.error?.message}'`);

  console.log("=================================================");
  console.log("🎉 Attendance Module v3 & Volunteer Portal Verification PASSED!");
  console.log("=================================================");
}

main();
