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
  console.log("🧪 Testing Complete End-to-End Attendance Workflow...");
  console.log("=================================================");

  const {
    createAttendanceSessionAction,
    openAttendanceSessionAction,
    pauseAttendanceSessionAction,
    closeAttendanceSessionAction,
  } = await import("../actions/attendance/attendance_sessions.actions");

  const {
    generateVolunteerCodeAction,
    validateVolunteerCodeAction,
  } = await import("../actions/attendance/volunteer_codes.actions");

  const {
    recordAttendanceAction,
    getSessionRecordsAction,
    exportAttendanceRecordsCsvAction,
  } = await import("../actions/attendance/attendance_records.actions");

  const { searchMembersAction } = await import("../actions/members/members.actions");

  // Step 1: Find a test member or create/search one
  const searchRes = await searchMembersAction({ page: 1, limit: 1 });
  if (!searchRes.success || !searchRes.data || searchRes.data.items.length === 0) {
    console.error("❌ No member found for attendance testing!");
    process.exit(1);
  }
  const testMember = searchRes.data.items[0];
  console.log(`✅ Using test member: ${testMember.name} (${testMember.id})`);

  // Step 2: Create Attendance Session
  const batchId = Math.floor(1000 + Math.random() * 8999);
  const createSessRes = await createAttendanceSessionAction({
    title: `Autonomous Rover Workshop ${batchId}`,
    date: new Date().toISOString(),
    startTime: "09:00:00",
    endTime: "17:00:00",
    attendancePoints: 15,
    lateThreshold: 20,
    latePoints: 5,
    status: "draft",
  });

  if (!createSessRes.success || !createSessRes.data) {
    console.error("❌ Failed to create attendance session:", createSessRes.error);
    process.exit(1);
  }
  const session = createSessRes.data;
  console.log(`✅ Step 1: Created Attendance Session: ${session.title} (ID: ${session.id})`);

  // Step 3: Open / Activate Session
  const openRes = await openAttendanceSessionAction(session.id);
  if (!openRes.success || !openRes.data || openRes.data.status !== "active") {
    console.error("❌ Failed to open attendance session:", openRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 2: Opened & Activated Attendance Session: ${openRes.data.status}`);

  // Step 4: Generate Volunteer PIN
  const genPinRes = await generateVolunteerCodeAction({ sessionId: session.id, expirationHours: 2 });
  if (!genPinRes.success || !genPinRes.data) {
    console.error("❌ Failed to generate volunteer PIN:", genPinRes.error);
    process.exit(1);
  }
  const volunteerCode = genPinRes.data;
  console.log(`✅ Step 3: Generated Volunteer PIN: ${volunteerCode.code}`);

  // Step 5: Verify / Validate Volunteer PIN
  const valPinRes = await validateVolunteerCodeAction({ code: volunteerCode.code });
  if (!valPinRes.success || !valPinRes.data) {
    console.error("❌ Failed to validate volunteer PIN:", valPinRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 4: Validated Volunteer PIN successfully: status=${valPinRes.data.status}`);

  // Step 6: Mark Member Attendance
  const recRes = await recordAttendanceAction({
    memberId: testMember.id,
    sessionId: session.id,
    method: "manual",
    remarks: "E2E Automated test scan",
  });

  if (!recRes.success || !recRes.data) {
    console.error("❌ Failed to record attendance scan:", recRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 5: Marked Attendance for member ${testMember.name}! Points: ${recRes.data.points}`);

  // Step 7: Prevent Duplicate Attendance
  const dupRes = await recordAttendanceAction({
    memberId: testMember.id,
    sessionId: session.id,
    method: "manual",
  });

  if (dupRes.success) {
    console.error("❌ Duplicate attendance check failed! Allowed duplicate scan.");
    process.exit(1);
  }
  console.log(`✅ Step 6: Duplicate Attendance cleanly prevented with message: '${dupRes.error?.message}'`);

  // Step 8: Fetch Session Records & Live Count
  const sessRecsRes = await getSessionRecordsAction(session.id);
  if (!sessRecsRes.success || !sessRecsRes.data) {
    console.error("❌ Failed to get session records:", sessRecsRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 7: Live Session Records retrieved: Count=${sessRecsRes.data.total}`);

  // Step 9: Pause & Close Session
  const pauseRes = await pauseAttendanceSessionAction(session.id);
  console.log(`✅ Step 8a: Paused session: status=${pauseRes.data?.status}`);

  const closeRes = await closeAttendanceSessionAction(session.id);
  console.log(`✅ Step 8b: Closed session: status=${closeRes.data?.status}`);

  // Step 10: Export Attendance CSV
  const csvRes = await exportAttendanceRecordsCsvAction();
  if (!csvRes.success || !csvRes.data) {
    console.error("❌ Failed to export attendance CSV:", csvRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 9: Exported Attendance CSV successfully! Size: ${csvRes.data.length} bytes`);

  console.log("=================================================");
  console.log("🎉 Complete Attendance E2E Workflow Verification PASSED!");
  console.log("=================================================");
}

main();
