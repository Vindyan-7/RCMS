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
  const lookupTables = [
    "branches",
    "academic_years",
    "semesters",
    "sections",
    "roles",
    "permissions",
    "role_permissions",
    "system_settings",
    "notification_templates",
    "point_rules",
    "sponsorship_packages",
  ];

  for (const table of lookupTables) {
    const { data, error } = await db.from(table).select("*").limit(1);
    if (error) {
      console.log(`Table '${table}': error`, error.message);
    } else {
      const sample = data[0] || {};
      console.log(`Table '${table}': columns ->`, Object.keys(sample));
    }
  }
}

main();
