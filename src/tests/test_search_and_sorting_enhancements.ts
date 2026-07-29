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
  console.log("🧪 Testing Members Search & Ascending Sorting Enhancements...");
  console.log("=================================================");

  const { importMembersCsvAction, searchMembersAction } = await import("../actions/members");
  const testBatch = Math.floor(1000 + Math.random() * 8999);

  // Sample CSV out of order (067, 002, 001)
  const sampleCsv = [
    "Name,Email,Roll Number,Department,Year,Phone,Role,Membership ID,Gender",
    `Test Member 67,m67.${testBatch}@robotics.org,26RC${testBatch}67,ECE,4,9876543067,Lead,SAC-RC-${testBatch}067,Male`,
    `Test Member 02,m02.${testBatch}@robotics.org,26RC${testBatch}02,CSE,2,9876543002,Member,SAC-RC-${testBatch}002,Female`,
    `Test Member 01,m01.${testBatch}@robotics.org,26RC${testBatch}01,CSM,1,9876543001,Member,SAC-RC-${testBatch}001,Male`,
  ].join("\n");

  const importRes = await importMembersCsvAction(sampleCsv);
  if (!importRes.success || !importRes.data) {
    console.error("❌ CSV import failed:", importRes.error);
    process.exit(1);
  }
  console.log("✅ Seeded test members for search & sorting check.");

  // Test 1: Partial Fuzzy Search on Club Membership ID
  const searchQueries = [
    `SAC-RC-${testBatch}067`,
    `${testBatch}067`,
    `067`,
    `RC-${testBatch}067`,
  ];

  for (const query of searchQueries) {
    const sRes = await searchMembersAction(query);
    if (!sRes.success || !sRes.data || sRes.data.items.length === 0) {
      console.error(`❌ Partial search for query '${query}' failed to find SAC-RC-${testBatch}067`);
      process.exit(1);
    }
    const found = sRes.data.items.find((m) => m.clubMembershipId === `SAC-RC-${testBatch}067`);
    if (!found) {
      console.error(`❌ Partial search '${query}' returned items, but not target SAC-RC-${testBatch}067`);
      process.exit(1);
    }
    console.log(`✅ Search for '${query}' matched Club Membership ID: ${found.clubMembershipId}`);
  }

  // Test 2: Ascending Numeric Ordering Verification (001 -> 002 -> 067)
  const allMembersRes = await searchMembersAction({ page: 1, limit: 100 });
  if (allMembersRes.success && allMembersRes.data) {
    const items = allMembersRes.data.items.filter((m) =>
      m.clubMembershipId?.startsWith(`SAC-RC-${testBatch}`)
    );
    console.log("\nAscending Display Order for Test Batch:");
    items.forEach((m) => console.log(`  - ${m.clubMembershipId} | ${m.name} | ${m.memberId}`));

    if (items.length === 3) {
      if (
        items[0].clubMembershipId === `SAC-RC-${testBatch}001` &&
        items[1].clubMembershipId === `SAC-RC-${testBatch}002` &&
        items[2].clubMembershipId === `SAC-RC-${testBatch}067`
      ) {
        console.log("✅ Verified Ascending Numeric Ordering: 001 -> 002 -> 067!");
      } else {
        console.error("❌ Members are not in expected ascending order!");
        process.exit(1);
      }
    }
  }

  console.log("=================================================");
  console.log("🎉 Members Search & Ascending Sorting Verification PASSED!");
  console.log("=================================================");
}

main();
