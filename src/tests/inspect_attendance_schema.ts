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
  const [sessionRes, recordRes, codeRes] = await Promise.all([
    db.from("attendance_sessions").select("*").limit(1),
    db.from("attendance_records").select("*").limit(1),
    db.from("volunteer_codes").select("*").limit(1),
  ]);

  console.log("=== Attendance Sessions Columns ===");
  console.log(Object.keys(sessionRes.data?.[0] || {}));

  console.log("=== Attendance Records Columns ===");
  console.log(Object.keys(recordRes.data?.[0] || {}));

  console.log("=== Volunteer Codes Columns ===");
  console.log(Object.keys(codeRes.data?.[0] || {}));
}

main();
