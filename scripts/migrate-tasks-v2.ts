import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Robotics%40club%402026@db.axaprqkzogwnchhikwyj.supabase.co:5432/postgres";
const sqlClient = postgres(connectionString);

async function runMigration() {
  console.log("🚀 Starting database task completions soft-revoke schema modification...");
  
  const queries = [
    `ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT false NOT NULL;`,
    `ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES users(id) ON DELETE SET NULL;`,
    `ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS revocation_reason TEXT;`
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
