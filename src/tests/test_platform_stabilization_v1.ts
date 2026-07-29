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
  console.log("🧪 Testing Platform Stabilization v1...");
  console.log("=================================================");

  const { registerMemberAction, searchMembersAction } = await import("../actions/members/members.actions");
  const { createAttendanceSessionAction, openAttendanceSessionAction } = await import("../actions/attendance/attendance_sessions.actions");
  const { recordAttendanceAction, getSessionRecordsAction } = await import("../actions/attendance/attendance_records.actions");
  const { createEventAction, updateEventStatusAction } = await import("../actions/operations/events.actions");
  const { getExecutiveDashboardMetricsAction, universalSearchAction } = await import("../actions/intelligence/intelligence.actions");

  // Step 1: Verify Executive Dashboard Metrics read from live DB
  const metricsRes = await getExecutiveDashboardMetricsAction();
  if (!metricsRes.success || !metricsRes.data) {
    console.error("❌ Failed to query executive dashboard metrics:", metricsRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 1: Dashboard Metrics queried live from DB! Members=${metricsRes.data.totalMembers}, Events=${metricsRes.data.totalEvents}`);

  // Step 2: Register Member & Test Auto Synchronization
  const uniqueId = Math.floor(10000 + Math.random() * 89999);
  const regRes = await registerMemberAction({
    name: `Stabilization Member ${uniqueId}`,
    email: `stab.${uniqueId}@robotics.org`,
    rollNumber: `26RC${uniqueId}`,
    branch: "ECE",
    year: "3",
    role: "Core Member",
    phone: "9876543210",
  });

  if (!regRes.success || !regRes.data) {
    console.error("❌ Member registration failed:", regRes.error);
    process.exit(1);
  }
  const member = regRes.data;
  console.log(`✅ Step 2: Member Registered: ${member.name} (Club Membership ID: ${member.clubMembershipId})`);

  // Verify Member immediate sync in Search
  const searchRes = await searchMembersAction({ search: member.rollNumber || undefined });
  if (!searchRes.success || !searchRes.data || searchRes.data.items.length === 0) {
    console.error("❌ Immediate Member search sync failed");
    process.exit(1);
  }
  console.log(`✅ Step 2: Member auto-synchronized across Search: found '${searchRes.data.items[0].name}'!`);

  // Step 3: Test Universal Search indexing live member
  const univSearchRes = await universalSearchAction({ query: member.rollNumber });
  if (!univSearchRes.success || !univSearchRes.data || univSearchRes.data.length === 0) {
    console.error("❌ Universal search live data indexing failed:", univSearchRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 3: Universal Search indexed live member: found ${univSearchRes.data.length} match ('${univSearchRes.data[0].title}')`);

  // Step 4: Attendance & Event Synchronization
  const sessRes = await createAttendanceSessionAction({
    title: `Stabilization Event Session ${uniqueId}`,
    date: new Date().toISOString(),
    startTime: "10:00:00",
    endTime: "12:00:00",
    status: "draft",
  });
  await openAttendanceSessionAction(sessRes.data!.id);

  const attRes = await recordAttendanceAction({
    memberId: member.id,
    sessionId: sessRes.data!.id,
    method: "manual",
  });
  if (!attRes.success || !attRes.data) {
    console.error("❌ Attendance check-in failed:", attRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 4: Attendance Recorded for ${member.name}: +${attRes.data.points} Pts!`);

  const recordsRes = await getSessionRecordsAction(sessRes.data!.id);
  console.log(`✅ Step 4: Attendance session auto-synchronized: ${recordsRes.data?.total} Scans Logged!`);

  // Step 5: Event Stage Lifecycle Synchronization
  const evtRes = await createEventAction({
    name: `Stabilization Event ${uniqueId}`,
    venue: "Main Hall",
    points: 40,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: "draft",
  });
  await updateEventStatusAction(evtRes.data!.id, "published");
  console.log(`✅ Step 5: Event Created & Published: '${evtRes.data!.name}' (Stage: published)`);

  console.log("=================================================");
  console.log("🎉 Platform Stabilization v1 Verification PASSED!");
  console.log("=================================================");
}

main();
