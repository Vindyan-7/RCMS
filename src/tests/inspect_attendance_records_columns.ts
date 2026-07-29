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
  const { data, error } = await db.rpc("get_table_columns", { table_name: "attendance_records" });
  if (error) {
    // Try simple insert and roll back or inspect error message
    const tryInsert = await db.from("attendance_records").insert({}).select();
    console.log("Insert Error details:", tryInsert.error?.message);
  } else {
    console.log("Columns:", data);
  }
}

main();
