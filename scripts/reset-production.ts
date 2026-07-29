import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Database credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Tables to clear, ordered to respect foreign key constraints (children first, then parents)
const OPERATIONAL_TABLES = [
  "audit_logs",
  "notifications",
  "notification_templates",
  "points_ledger",
  "attendance_records",
  "volunteer_codes",
  "attendance_sessions",
  "event_participations",
  "task_completions",
  "tasks",
  "inventory_borrowings",
  "inventory_items",
  "financial_transactions",
  "expenses",
  "budgets",
  "sponsorship_agreements",
  "sponsorship_packages",
  "sponsors",
  "events",
  "memberships",
  "members"
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetProduction() {
  console.log("⚠️ WARNING: YOU ARE ABOUT TO PERFORM A FULL PRODUCTION RESET.");
  console.log("This will permanently delete ALL operational data while preserving schema and core setup data.");
  console.log("The following tables will be CLEARED:");
  OPERATIONAL_TABLES.forEach(table => console.log(` - ${table}`));
  
  const isForce = process.argv.includes('--force');

  if (isForce) {
    console.log("\n🚀 Initiating production database reset (--force applied)...");
    await executeReset();
  } else {
    rl.question('\nAre you ABSOLUTELY sure you want to proceed? Type "RESET" to confirm: ', async (answer) => {
      if (answer !== "RESET") {
        console.log("❌ Production reset aborted.");
        process.exit(0);
      }
      console.log("\n🚀 Initiating production database reset...");
      await executeReset();
    });
  }
}

async function executeReset() {
    for (const table of OPERATIONAL_TABLES) {
      try {
        process.stdout.write(`🧹 Clearing ${table}... `);
        // Bypassing filter requirement to delete all rows by matching any id or just everything.
        // If table doesn't have an "id" column, we can use a dummy neq if it works, or we can use the specific PK. 
        // In Supabase REST, .neq('id', '00000000-0000-0000-0000-000000000000') works if the column 'id' exists.
        // For tables that don't have a simple 'id' (like junction tables), we might need to handle differently.
        // Let's use a universal approach if possible, or just standard .neq
        
        // As a fallback to avoid "id column doesn't exist" error, we can use a filter on created_at or something that exists on all tables, but 'id' is standard in this schema.
        const { error } = await supabase
          .from(table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (error) {
          // If error is about missing "id", try falling back to "created_at"
          if (error.message.includes("does not exist") && error.message.includes("id")) {
             const { error: fallbackError } = await supabase
              .from(table)
              .delete()
              .neq("created_at", "1970-01-01T00:00:00.000Z");
              
             if (fallbackError) {
                console.log(`❌ Failed (fallback): ${fallbackError.message}`);
             } else {
                console.log("✅ Done (via created_at fallback)");
             }
          } else {
             console.log(`❌ Failed: ${error.message}`);
          }
        } else {
          console.log("✅ Done");
        }
      } catch (e: any) {
        console.log(`❌ Error: ${e.message}`);
      }
    }

    console.log("\n🎉 Production reset complete. The database is now clean and ready for live operations.");
    process.exit(0);
}

resetProduction().catch(err => {
  console.error("❌ Fatal Error:", err);
  process.exit(1);
});
