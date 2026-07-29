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
  const { db } = await import("../db");
  const systemId = "00000000-0000-0000-0000-000000000001";
  const { data: existing } = await db.from("members").select("id").eq("id", systemId).single();
  
  if (!existing) {
    const { data: created, error } = await db.from("members").insert({
      id: systemId,
      member_id: "MEM-SYSTEM-001",
      name: "System Admin",
      email: "system.admin@robotics.org",
      roll_number: "SYSTEM-001",
      phone: "0000000000",
      status: "Active",
      created_by: systemId,
      updated_by: systemId,
    }).select().single();
    console.log("Created system actor member:", created, "Error:", error);
  } else {
    console.log("System actor member already exists:", existing);
  }
}

main();
