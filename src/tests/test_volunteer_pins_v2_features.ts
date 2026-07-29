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
  console.log("🧪 Testing Volunteer PIN Management System v2...");
  console.log("=================================================");

  const { createAttendanceSessionAction, openAttendanceSessionAction } = await import("../actions/attendance/attendance_sessions.actions");
  const {
    generateVolunteerCodeAction,
    validateVolunteerCodeAction,
    getSessionVolunteerCodesAction,
    endVolunteerCodeAction,
  } = await import("../actions/attendance/volunteer_codes.actions");

  // Step 1: Create and activate active attendance session
  const batchId = Math.floor(1000 + Math.random() * 8999);
  const sessRes = await createAttendanceSessionAction({
    title: `PIN v2 Test Session ${batchId}`,
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
  console.log(`✅ Step 1: Active session created: ${session.title}`);

  // Step 2: Generate 1st PIN (Validity 30 mins)
  const pin1Res = await generateVolunteerCodeAction({ sessionId: session.id, expirationMinutes: 30 });
  if (!pin1Res.success || !pin1Res.data) {
    console.error("❌ Failed to generate 1st PIN:", pin1Res.error);
    process.exit(1);
  }
  const pin1 = pin1Res.data;
  console.log(`✅ Step 2: Generated 1st PIN: ${pin1.code} (Expires: ${pin1.expiresAt})`);

  // Step 3: Generate 2nd PIN (Validity 15 mins)
  const pin2Res = await generateVolunteerCodeAction({ sessionId: session.id, expirationMinutes: 15 });
  if (!pin2Res.success || !pin2Res.data) {
    console.error("❌ Failed to generate 2nd PIN:", pin2Res.error);
    process.exit(1);
  }
  const pin2 = pin2Res.data;
  console.log(`✅ Step 3: Generated 2nd PIN: ${pin2.code} (Expires: ${pin2.expiresAt})`);

  // Step 4: Attempt 3rd PIN (Should fail max 2 active PIN limit)
  const pin3Res = await generateVolunteerCodeAction({ sessionId: session.id, expirationMinutes: 30 });
  if (pin3Res.success) {
    console.error("❌ Max PIN limit check failed! Generated 3rd active PIN.");
    process.exit(1);
  }
  console.log(`✅ Step 4: 3rd PIN correctly rejected with message: '${pin3Res.error?.message}'`);

  // Step 5: Verify PIN registry lists both active PINs
  const listRes = await getSessionVolunteerCodesAction(session.id);
  if (!listRes.success || !listRes.data || listRes.data.length < 2) {
    console.error("❌ Failed to query session PIN registry");
    process.exit(1);
  }
  console.log(`✅ Step 5: Session PIN Registry count: ${listRes.data.length} PINs listed.`);

  // Step 6: Validate PIN 1
  const valRes = await validateVolunteerCodeAction({ code: pin1.code });
  if (!valRes.success || !valRes.data || valRes.data.status !== "active") {
    console.error("❌ PIN 1 validation failed:", valRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 6: Validated PIN 1 (${pin1.code}) successfully: status=${valRes.data.status}`);

  // Step 7: Manually Terminate PIN 1 to free a slot
  const endRes = await endVolunteerCodeAction(pin1.id);
  if (!endRes.success || !endRes.data || endRes.data.status !== "ended") {
    console.error("❌ Failed to end PIN 1:", endRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 7: PIN 1 manually terminated: status=${endRes.data.status}`);

  // Step 8: Generate Replacement PIN (Slot freed)
  const pin4Res = await generateVolunteerCodeAction({ sessionId: session.id, expirationMinutes: 45 });
  if (!pin4Res.success || !pin4Res.data) {
    console.error("❌ Failed to generate replacement PIN after ending slot:", pin4Res.error);
    process.exit(1);
  }
  console.log(`✅ Step 8: Successfully generated replacement PIN (${pin4Res.data.code}) after freeing slot!`);

  console.log("=================================================");
  console.log("🎉 Volunteer PIN Management System v2 Verification PASSED!");
  console.log("=================================================");
}

main();
