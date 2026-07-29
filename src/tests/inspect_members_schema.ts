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
  const { data, error } = await db.from("members").select("*").limit(1);
  if (error) {
    console.error("Error querying members table:", error.message);
  } else {
    console.log("Members Table Columns in Supabase DB:", Object.keys(data[0] || {}));
    console.log("Sample Member Row:", data[0]);
  }
}

main();
