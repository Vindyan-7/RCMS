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
  console.log("🧪 Testing Complete Roundtrip Official CSV Import...");
  console.log("=================================================");

  const { importMembersCsvAction, searchMembersAction } = await import("../actions/members");
  const batchTag = Math.floor(10000 + Math.random() * 89999);

  // Official CSV format input
  const sampleRecords = [
    { name: "Official Member ECE", email: `ece.${batchTag}@robotics.org`, rollNumber: `26RC${batchTag}1`, department: "ECE", year: "1", phone: "9876543211", role: "Member", membershipId: `SAC-RC-${batchTag}1`, gender: "Male" },
    { name: "Official Member CSM", email: `csm.${batchTag}@robotics.org`, rollNumber: `26RC${batchTag}2`, department: "CSM", year: "2", phone: "9876543212", role: "Lead", membershipId: `SAC-RC-${batchTag}2`, gender: "Female" },
    { name: "Official Member CSC", email: `csc.${batchTag}@robotics.org`, rollNumber: `26RC${batchTag}3`, department: "CSC", year: "3", phone: "9876543213", role: "Core Member", membershipId: `SAC-RC-${batchTag}3`, gender: "Other" },
  ];

  const csvContent = [
    "Name,Email,Roll Number,Department,Year,Phone,Role,Membership ID,Gender",
    ...sampleRecords.map((r) => `${r.name},${r.email},${r.rollNumber},${r.department},${r.year},${r.phone},${r.role},${r.membershipId},${r.gender}`),
  ].join("\n");

  const res = await importMembersCsvAction(csvContent);
  if (!res.success || !res.data) {
    console.error("❌ CSV import action failed:", res.error);
    process.exit(1);
  }

  console.log("Import Report:", res.data);
  if (res.data.imported !== 3) {
    console.error(`❌ Expected 3 imported rows, got ${res.data.imported}`);
    process.exit(1);
  }

  // Verify Roundtrip Database Read via searchMembersAction
  for (const record of sampleRecords) {
    const searchRes = await searchMembersAction(record.email);
    if (!searchRes.success || !searchRes.data || searchRes.data.items.length === 0) {
      console.error(`❌ Member ${record.email} not found after import!`);
      process.exit(1);
    }

    const fetched = searchRes.data.items[0];
    console.log(`\nVerifying imported record [${fetched.name}]:`);
    console.log(`- Email              : ${fetched.email} (Expected: ${record.email})`);
    console.log(`- Roll Number        : ${fetched.rollNumber} (Expected: ${record.rollNumber})`);
    console.log(`- Club Membership ID : ${fetched.clubMembershipId} (Expected: ${record.membershipId})`);
    console.log(`- Department / Branch: ${fetched.branch} (Expected: ${record.department})`);
    console.log(`- Branch ID          : ${fetched.branchId}`);
    console.log(`- Year               : ${fetched.year} (Expected: ${record.year})`);
    console.log(`- Phone              : ${fetched.phone} (Expected: ${record.phone})`);
    console.log(`- Role               : ${fetched.role} (Expected: ${record.role})`);
    console.log(`- Gender             : ${fetched.gender} (Expected: ${record.gender})`);

    // Assert every field survived intact
    if (fetched.clubMembershipId !== record.membershipId) {
      console.error(`❌ Club Membership ID mismatch! Got '${fetched.clubMembershipId}', expected '${record.membershipId}'`);
      process.exit(1);
    }
    if (fetched.branch !== record.department) {
      console.error(`❌ Department branch mismatch! Got '${fetched.branch}', expected '${record.department}'`);
      process.exit(1);
    }
    if (!fetched.branchId) {
      console.error(`❌ Branch ID missing! Expected resolved branch_id from branches table`);
      process.exit(1);
    }
  }

  console.log("\n=================================================");
  console.log("🎉 Complete Roundtrip Official CSV Import PASSED!");
  console.log("=================================================");
}

main();
