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
  console.log("🧪 Testing Official CSV Import with Seeded Branches...");
  console.log("=================================================");

  const { importMembersCsvAction, searchMembersAction } = await import("../actions/members");
  const seedBatchId = Math.floor(10000 + Math.random() * 89999);

  // CSV with all 11 branches (mixed casing ece, CSM, csc, etc.)
  const officialCsvSample = [
    "Name,Email,Roll Number,Department,Year,Phone,Role,Membership ID,Gender",
    `Member ECE,ece.${seedBatchId}@robotics.org,26RC${seedBatchId}1,ece,1,9876543101,Member,SAC-RC-${seedBatchId}1,Male`,
    `Member CSE,cse.${seedBatchId}@robotics.org,26RC${seedBatchId}2,CSE,2,9876543102,Member,SAC-RC-${seedBatchId}2,Female`,
    `Member CSC,csc.${seedBatchId}@robotics.org,26RC${seedBatchId}3,csc,3,9876543103,Core Member,SAC-RC-${seedBatchId}3,Male`,
    `Member CSM,csm.${seedBatchId}@robotics.org,26RC${seedBatchId}4,CSM,4,9876543104,Lead,SAC-RC-${seedBatchId}4,Female`,
    `Member EEE,eee.${seedBatchId}@robotics.org,26RC${seedBatchId}5,Eee,1,9876543105,Member,SAC-RC-${seedBatchId}5,Male`,
    `Member AIML,aiml.${seedBatchId}@robotics.org,26RC${seedBatchId}6,aiml,2,9876543106,Member,SAC-RC-${seedBatchId}6,Female`,
    `Member AIDS,aids.${seedBatchId}@robotics.org,26RC${seedBatchId}7,Aids,3,9876543107,Member,SAC-RC-${seedBatchId}7,Other`,
    `Member IT,it.${seedBatchId}@robotics.org,26RC${seedBatchId}8,it,4,9876543108,Officer,SAC-RC-${seedBatchId}8,Male`,
    `Member MECH,mech.${seedBatchId}@robotics.org,26RC${seedBatchId}9,MECH,1,9876543109,Member,SAC-RC-${seedBatchId}9,Female`,
    `Member CIVIL,civil.${seedBatchId}@robotics.org,26RC${seedBatchId}10,Civil,2,9876543110,Member,SAC-RC-${seedBatchId}10,Male`,
    `Member OTHER,other.${seedBatchId}@robotics.org,26RC${seedBatchId}11,OTHER,3,9876543111,Member,SAC-RC-${seedBatchId}11,Prefer Not To Say`,
    `Invalid Member,invalid.${seedBatchId}@robotics.org,26RC${seedBatchId}12,NONEXISTENT,1,9876543112,Member,SAC-RC-${seedBatchId}12,Male`,
  ].join("\n");

  const res = await importMembersCsvAction(officialCsvSample);
  if (!res.success || !res.data) {
    console.error("❌ CSV import action failed:", res.error);
    process.exit(1);
  }

  const report = res.data;
  console.log("Import Report Total Rows:", report.totalRows);
  console.log("Imported Count:", report.imported);
  console.log("Skipped Count:", report.skipped);
  console.log("Failure Breakdown:", report.breakdown);
  console.log("Report Errors:", report.errors);

  if (report.imported !== 11 || report.skipped !== 1) {
    console.error(`❌ Expected 11 imported and 1 skipped, got ${report.imported} imported, ${report.skipped} skipped`);
    process.exit(1);
  }

  console.log("✅ All 11 official seeded branches imported successfully and non-existent branch 'NONEXISTENT' was skipped with clear reason!");

  // Verify search & branch filtering
  const csmSearchRes = await searchMembersAction({ branch: "CSM", page: 1, limit: 10 });
  if (csmSearchRes.success && csmSearchRes.data) {
    console.log("✅ Branch search for 'CSM' returned items count:", csmSearchRes.data.items.length);
  }

  console.log("=================================================");
  console.log("🎉 Official CSV Import with Seeded Branches PASSED!");
  console.log("=================================================");
}

main();
