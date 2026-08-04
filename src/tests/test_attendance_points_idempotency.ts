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

import { supabase } from "../db/index";
import { AttendanceRecordsService } from "../services/attendance/attendance_records.service";
import { AttendanceRepairService } from "../services/attendance/attendance_repair.service";
import { AttendanceRecordsRepository } from "../repositories/attendance/attendance_records.repository";
import { AttendanceSessionsRepository } from "../repositories/attendance/attendance_sessions.repository";
import { MembersRepository } from "../repositories/members/members.repository";
import { PointsLedgerRepository } from "../repositories/points/points_ledger.repository";

async function main() {
  console.log("=== STEP 1: Dynamic Imports & One-Time Repair Routine ===");
  const repairService = new AttendanceRepairService();
  const repairResult = await repairService.repairDuplicateAttendancePoints();
  console.log("Repair result:", repairResult);

  console.log("\n=== STEP 2: Creating Test Session & Members ===");
  const recordsRepo = new AttendanceRecordsRepository();
  const sessionsRepo = new AttendanceSessionsRepository();
  const membersRepo = new MembersRepository();
  const ledgerRepo = new PointsLedgerRepository();
  const recordsService = new AttendanceRecordsService(recordsRepo, sessionsRepo, membersRepo);

  // 1. Find or create a test session
  const { data: sessData } = await supabase
    .from("attendance_sessions")
    .select("*")
    .limit(1);

  if (!sessData || sessData.length === 0) {
    console.log("No test attendance session found. Skipping dynamic test.");
    return;
  }

  const testSession = sessData[0];
  console.log(`Using Session "${testSession.title}" (${testSession.id})`);

  // 2. Fetch two test members
  const { data: mems } = await supabase.from("members").select("id, name").limit(2);
  if (!mems || mems.length < 2) {
    console.log("Not enough members for testing.");
    return;
  }

  const memA = mems[0];
  const memB = mems[1];
  console.log(`Test Members: ${memA.name} (${memA.id}), ${memB.name} (${memB.id})`);

  // Initial total points
  const initialPointsA = await ledgerRepo.calculateMemberTotalPoints(memA.id);
  console.log(`Initial Points for ${memA.name}:`, initialPointsA);

  console.log("\n=== STEP 3: Initial Sync (Add Member A) ===");
  await recordsService.bulkRecordAttendance(testSession.id, [memA.id], "00000000-0000-0000-0000-000000000001");

  const pointsAfterAddA = await ledgerRepo.calculateMemberTotalPoints(memA.id);
  console.log(`Points after adding Member A once:`, pointsAfterAddA);

  console.log("\n=== STEP 4: Idempotency Test (Repeat Save Member A 5 Times) ===");
  for (let i = 1; i <= 5; i++) {
    await recordsService.bulkRecordAttendance(testSession.id, [memA.id], "00000000-0000-0000-0000-000000000001");
  }

  const pointsAfterRepeatSaves = await ledgerRepo.calculateMemberTotalPoints(memA.id);
  console.log(`Points after 5 repeat saves of Member A:`, pointsAfterRepeatSaves);

  if (pointsAfterAddA !== pointsAfterRepeatSaves) {
    console.error("❌ FAILED: Repeat saves awarded additional points!");
    process.exit(1);
  } else {
    console.log("✅ PASSED: Repeat saves resulted in ZERO additional points!");
  }

  console.log("\n=== STEP 5: Delta Add Test (Add Member B) ===");
  await recordsService.bulkRecordAttendance(testSession.id, [memA.id, memB.id], "00000000-0000-0000-0000-000000000001");

  const pointsAfterAddB = await ledgerRepo.calculateMemberTotalPoints(memB.id);
  const pointsAUnchanged = await ledgerRepo.calculateMemberTotalPoints(memA.id);

  console.log(`Points for Member B after being added:`, pointsAfterAddB);
  console.log(`Points for Member A after adding B:`, pointsAUnchanged);

  if (pointsAUnchanged !== pointsAfterAddA) {
    console.error("❌ FAILED: Member A points changed when Member B was added!");
    process.exit(1);
  } else {
    console.log("✅ PASSED: Member A points remained unchanged when Member B was added!");
  }

  console.log("\n=== STEP 6: Delta Remove Test (Remove Member A) ===");
  await recordsService.bulkRecordAttendance(testSession.id, [memB.id], "00000000-0000-0000-0000-000000000001");

  const pointsAfterRemoveA = await ledgerRepo.calculateMemberTotalPoints(memA.id);
  console.log(`Points for Member A after being removed from session:`, pointsAfterRemoveA);

  if (pointsAfterRemoveA !== initialPointsA) {
    console.error(`❌ FAILED: Member A points (${pointsAfterRemoveA}) did not revert to initial (${initialPointsA})!`);
    process.exit(1);
  } else {
    console.log("✅ PASSED: Member A points reverted cleanly upon removal!");
  }

  console.log("\n=== STEP 7: Final Repair Routine Run ===");
  const finalRepair = await repairService.repairDuplicateAttendancePoints();
  console.log("Final repair result:", finalRepair);

  console.log("\nALL IDEMPOTENCY & REPAIR INTEGRATION TESTS COMPLETED SUCCESSFULLY! 🎉");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
