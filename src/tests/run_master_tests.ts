/**
 * Master Integration Test Suite Execution Script
 */

import * as fs from "fs";
import * as path from "path";

// Manually load .env.local environment variables if present
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

async function ensureSystemActorExists() {
  const { db } = await import("../db");
  const systemId = "00000000-0000-0000-0000-000000000001";
  const { data: existing } = await db.from("members").select("id").eq("id", systemId).single();
  
  if (!existing) {
    await db.from("members").insert({
      id: systemId,
      member_id: "MEM-SYSTEM-001",
      name: "System Admin",
      email: "system.admin@robotics.org",
      roll_number: "SYSTEM-001",
      phone: "0000000000",
      status: "Active",
      created_by: systemId,
      updated_by: systemId,
    });
  }
}

async function main() {
  console.log("=================================================");
  console.log("🚀 Starting Full Master Integration Test Suite...");
  console.log("=================================================\n");

  await ensureSystemActorExists();
  const { runFullMasterRegressionSuite } = await import("./master.integration.test");

  try {
    const results = await runFullMasterRegressionSuite();
    console.log("\n=================================================");
    console.log("📊 MASTER TEST SUITE RESULTS SUMMARY");
    console.log("=================================================");
    console.log(`Total Tests Executed : ${results.total}`);
    console.log(`Passed               : ${results.passed}`);
    console.log(`Failed               : ${results.failed}`);
    console.log("-------------------------------------------------");
    console.log("Domain Breakdown:");
    for (const [domain, detail] of Object.entries(results.suiteDetails)) {
      console.log(`  - ${domain.padEnd(22)}: ${detail.passed}/${detail.total} passed`);
    }
    console.log("=================================================\n");
  } catch (err: any) {
    console.error("❌ Execution Error during Master Test Suite:", err.message || err);
  }
}

main();
