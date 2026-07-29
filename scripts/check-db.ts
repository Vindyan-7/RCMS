import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const TABLES = [
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

async function check() {
  console.log("Checking DB counts...");
  for (const table of TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    
    if (error) {
      console.log(` - ${table}: Error - ${error.message}`);
    } else {
      console.log(` - ${table}: ${count} rows`);
    }
  }
}

check().catch(console.error);
