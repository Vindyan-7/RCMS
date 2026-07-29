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
    const { data: inserted, error } = await db.from("attendance_records").insert({
      member_id: member.id,
      session_id: session.id,
      status: "present",
      points: 10,
    }).select().single();

    if (error) {
      console.error("Insert error:", error);
    } else {
      console.log("Successfully inserted record:", Object.keys(inserted));
      // cleanup
      await db.from("attendance_records").delete().eq("id", inserted.id);
    }
  }
}

main();
