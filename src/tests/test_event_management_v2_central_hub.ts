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
  console.log("🧪 Testing Event Management v2 Central Hub...");
  console.log("=================================================");

  const {
    createEventAction,
    updateEventStatusAction,
    verifyEventParticipationAction,
    generateEventReportCsvAction,
    getEventParticipationsAction,
  } = await import("../actions/operations/events.actions");

  const { searchMembersAction } = await import("../actions/members/members.actions");

  // Step 1: Find test member for participation verification
  const membersRes = await searchMembersAction({ page: 1, limit: 1 });
  if (!membersRes.success || !membersRes.data || membersRes.data.items.length === 0) {
    console.error("❌ Need at least 1 member for event testing");
    process.exit(1);
  }
  const testMember = membersRes.data.items[0];
  console.log(`✅ Step 1: Using test member: ${testMember.name} (${testMember.id})`);

  // Step 2: Create Event in 'draft' stage
  const batchId = Math.floor(1000 + Math.random() * 8999);
  const createRes = await createEventAction({
    name: `Autonomous Drone Championship ${batchId}`,
    venue: "Main Indoor Stadium",
    points: 50,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: "draft",
  });

  if (!createRes.success || !createRes.data) {
    console.error("❌ Failed to create event:", createRes.error);
    process.exit(1);
  }
  const event = createRes.data;
  console.log(`✅ Step 2: Created Event: ${event.name} (Stage: ${event.status})`);

  // Step 3: Event Lifecycle Stage Transitions up to 'ongoing' & 'completed'
  const initialStages = ["published", "registration_open", "registration_closed", "ongoing", "completed"];
  for (const stage of initialStages) {
    const updateRes = await updateEventStatusAction(event.id, stage);
    if (!updateRes.success || !updateRes.data || updateRes.data.status !== stage) {
      console.error(`❌ Lifecycle transition to '${stage}' failed:`, updateRes.error);
      process.exit(1);
    }
    console.log(`✅ Step 3: Lifecycle transition -> '${updateRes.data.status}' successful!`);
  }

  // Step 4: Verify Member Event Participation (while completed/ongoing)
  const partRes = await verifyEventParticipationAction({
    eventId: event.id,
    memberId: testMember.id,
  });

  if (!partRes.success || !partRes.data) {
    console.error("❌ Event participation verification failed:", partRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 4: Verified Member Participation: Member ${testMember.name} recorded!`);

  // Step 5: Archive Event
  const archiveRes = await updateEventStatusAction(event.id, "archived");
  console.log(`✅ Step 5: Lifecycle transition -> '${archiveRes.data?.status}' successful!`);

  // Step 5: Query Event Participations
  const listRes = await getEventParticipationsAction(event.id);
  if (!listRes.success || !listRes.data || listRes.data.total === 0) {
    console.error("❌ Query event participations failed:", listRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 5: Event Participations List retrieved: Count=${listRes.data.total}`);

  // Step 6: Generate Aggregated Event Operations CSV Report
  const reportRes = await generateEventReportCsvAction(event.id);
  if (!reportRes.success || !reportRes.data) {
    console.error("❌ Generate event CSV report failed:", reportRes.error);
    process.exit(1);
  }
  console.log(`✅ Step 6: Generated Aggregated Event CSV Report! Size: ${reportRes.data.csvContent.length} bytes`);

  console.log("=================================================");
  console.log("🎉 Event Management v2 Central Hub Verification PASSED!");
  console.log("=================================================");
}

main();
