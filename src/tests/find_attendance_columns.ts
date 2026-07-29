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
  const { data: member } = await db.from("members").select("id").limit(1).single();
  const { data: session } = await db.from("attendance_sessions").select("id").limit(1).single();

  if (member && session) {
    // Try inserting minimal payload (member_id, session_id)
    const res = await db.from("attendance_records").insert({
      member_id: member.id,
      session_id: session.id,
      points: 10,
    }).select().single();

    if (res.error) {
      console.log("Minimal insert error:", res.error.message);
    } else {
      console.log("SUCCESS! Columns of attendance_records:", Object.keys(res.data));
      await db.from("attendance_records").delete().eq("id", res.data.id);
    }
  }
}

main();
