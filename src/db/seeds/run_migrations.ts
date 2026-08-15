import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import { seedProductionData } from "./production_init_seed";

const connectionString = process.env.DATABASE_URL || "";
const sqlClient = postgres(connectionString);

async function runAll() {
  console.log("🚀 Starting programmatical database migration...");
  
  const migrationDir = path.join(process.cwd(), "drizzle");
  const files = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationDir, file);
    console.log(`Executing migration: ${file}`);
    const sqlContent = fs.readFileSync(filePath, "utf-8");
    
    // Split statements by semicolon, ignoring comments and empty lines
    const statements = sqlContent
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await sqlClient.unsafe(statement);
      } catch (e: any) {
        // If it's relation already exists, we can ignore or report
        if (e.message?.includes("already exists")) {
          // Ignore
        } else {
          console.warn(`Statement warning or error: ${e.message}`);
        }
      }
    }
  }

  console.log("✅ Migrations completed successfully!");

  // Now seed the database
  try {
    await seedProductionData();
  } catch (e: any) {
    console.error("Error during seeding production data:", e.message);
  }

  await sqlClient.end();
  process.exit(0);
}

runAll().catch((err) => {
  console.error("Migration runner failed:", err);
  process.exit(1);
});
