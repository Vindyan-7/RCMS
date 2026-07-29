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

async function testColumn(tableName: string, columnName: string) {
  const { error } = await supabase
    .from(tableName)
    .select(columnName)
    .limit(1);

  if (error) {
    if (error.code === "PGRST204" || error.code === "42703") {
      console.log(` - ${tableName}.${columnName}: DOES NOT EXIST (Error code: ${error.code})`);
      return false;
    } else {
      console.log(` - ${tableName}.${columnName}: EXISTENCE UNKNOWN (Error: ${error.message}, Code: ${error.code})`);
      return false;
    }
  } else {
    console.log(` - ${tableName}.${columnName}: EXISTS`);
    return true;
  }
}

async function inspect() {
  console.log("Testing columns in 'tasks' table:");
  await testColumn("tasks", "due_date");
  await testColumn("tasks", "start_date");
  await testColumn("tasks", "is_unlimited");
  await testColumn("tasks", "max_members");
  await testColumn("tasks", "event_id");

  console.log("Testing columns in 'task_completions' table:");
  await testColumn("task_completions", "completed_by");
  await testColumn("task_completions", "points_earned");
}

inspect().catch(console.error);
