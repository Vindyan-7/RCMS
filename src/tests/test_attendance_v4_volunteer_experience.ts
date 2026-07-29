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
  console.log("🧪 Testing Attendance Module v4 Volunteer Experience...");
  console.log("=================================================");

  const { createAttendanceSessionAction, openAttendanceSessionAction } = await import("../actions/attendance/attendance_sessions.actions");
  const { generateVolunteerCodeAction, loginVolunteerPortalAction } = await import("../actions/attendance/volunteer_codes.actions");
  const { recordAttendanceAction, getSessionRecordsAction } = await import("../actions/attendance/attendance_records.actions");
  const { searchMembersAction } = await import("../actions/members/members.actions");

  // Step 1: Query members for testing
  const membersRes = await searchMembersAction({ page: 1, limit: 10 });
  if (!membersRes.success || !membersRes.data || membersRes.data.items.length < 3) {
    console.error("❌ Need at least 3 members for v4 experience testing");
    process.exit(1);
  }
  const volunteer = membersRes.data.items[0];
  const member1 = membersRes.data.items[1];
  const member2 = membersRes.data.items[2];

  console.log(`✅ Step 1: Volunteer: ${volunteer.name}`);
  console.log(`✅ Step 1: Test Members: ${member1.name} (${member1.clubMembershipId}), ${member2.name} (${member2.clubMembershipId})`);

  // Step 2: Create Active Session
  const batchId = Math.floor(1000 + Math.random() * 8999);
  const sessRes = await createAttendanceSessionAction({
    title: `Autonomous Navigation Workshop ${batchId}`,
    date: new Date().toISOString(),
    startTime: "09:00:00",
    endTime: "17:00:00",
    status: "draft",
  });

  if (!sessRes.success || !sessRes.data) {
    console.error("❌ Session creation failed:", sessRes.error);
    process.exit(1);
  }
  const session = sessRes.data;
  await openAttendanceSessionAction(session.id);
  console.log(`✅ Step 2: Active Session: ${session.title} (ID: ${session.id})`);

  // Step 3: Generate Volunteer PIN
  const pinRes = await generateVolunteerCodeAction({ sessionId: session.id, expirationMinutes: 30 });
  if (!pinRes.success || !pinRes.data) {
    console.error("❌ PIN generation failed:", pinRes.error);
    process.exit(1);
  }
  const pin = pinRes.data;
  console.log(`✅ Step 3: Volunteer PIN generated: ${pin.code} (Expires: ${pin.expiresAt})`);

  // Step 4: Authenticate Volunteer Portal App
  const authRes = await loginVolunteerPortalAction({
    memberInput: volunteer.clubMembershipId || volunteer.rollNumber || volunteer.email,
    pinCode: pin.code,
  });

  if (!authRes.success || !authRes.data) {
    console.error("❌ Volunteer Portal Authentication failed:", authRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 4: Volunteer Portal Authenticated! Session status: ${authRes.data.session.status}`);

  // Step 5: Fast Successive Attendance Check-in 1
  const rec1 = await recordAttendanceAction({
    memberId: member1.id,
    sessionId: session.id,
    method: "manual",
  });
  if (!rec1.success || !rec1.data) {
    console.error("❌ Check-in 1 failed:", rec1.error);
    process.exit(1);
  }
  console.log(`✅ Step 5a: Marked PRESENT member 1 (${member1.name}): +${rec1.data.points} Pts`);

  // Step 6: Fast Successive Attendance Check-in 2
  const rec2 = await recordAttendanceAction({
    memberId: member2.id,
    sessionId: session.id,
    method: "manual",
  });
  if (!rec2.success || !rec2.data) {
    console.error("❌ Check-in 2 failed:", rec2.error);
    process.exit(1);
  }
  console.log(`✅ Step 5b: Marked PRESENT member 2 (${member2.name}): +${rec2.data.points} Pts`);

  // Step 7: Verify Live Attendance Counter & Duplicate Prevention
  const countRes = await getSessionRecordsAction(session.id);
  if (!countRes.success || !countRes.data || countRes.data.total !== 2) {
    console.error("❌ Live attendance counter verification failed:", countRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 6: Live Attendance Counter verified: ${countRes.data.total} Scans Logged!`);

  // Step 8: Prevent Duplicate Check-in
  const dupRes = await recordAttendanceAction({
    memberId: member1.id,
    sessionId: session.id,
    method: "manual",
  });
  if (dupRes.success) {
    console.error("❌ Duplicate check-in prevention failed!");
    process.exit(1);
  }
  console.log(`✅ Step 7: Duplicate check-in cleanly prevented: '${dupRes.error?.message}'`);

  console.log("=================================================");
  console.log("🎉 Attendance Module v4 Volunteer Experience Verification PASSED!");
  console.log("=================================================");
}

main();
