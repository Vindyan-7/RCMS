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
  console.log("🌱 Testing Master/Lookup Tables Seeding without Users...");
  console.log("=================================================");

  const { db } = await import("../db");

  // 1. Seed a Branch with created_by = NULL (simulating seed on empty DB without users)
  const testBranchCode = `SEED-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data: branchData, error: branchError } = await db
    .from("branches")
    .insert({
      code: testBranchCode,
      name: `Seeded Branch ${testBranchCode}`,
      created_by: null,
      updated_by: null,
    })
    .select()
    .single();

  if (branchError) {
    console.error("❌ Seeding branch without user failed:", branchError.message);
    process.exit(1);
  }

  console.log("✅ Seeded branch successfully without user:", branchData.code, "ID:", branchData.id);

  // 2. Clean up test seeded record
  await db.from("branches").delete().eq("id", branchData.id);
  console.log("🧹 Cleaned up test seed record.");
  console.log("=================================================");
  console.log("🎉 Seeding verification on empty database PASSED!");
  console.log("=================================================");
}

main();
