import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "";
const sqlClient = postgres(connectionString);

async function runMigration() {
  console.log("🚀 Starting database task schema modification...");
  
  const queries = [
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false NOT NULL;`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS max_members INTEGER;`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;`,
    `ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0 NOT NULL;`,
    `ALTER TABLE task_completions DROP CONSTRAINT IF EXISTS task_completions_task_member_uq;`
  ];

  for (const q of queries) {
    try {
      console.log(`Executing: ${q}`);
      await sqlClient.unsafe(q);
      console.log("✅ Query successful");
    } catch (e: any) {
      console.error(`❌ Query failed: ${e.message}`);
    }
  }

  await sqlClient.end();
  console.log("🎉 Migration finished.");
  process.exit(0);
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
