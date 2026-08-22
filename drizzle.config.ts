import { defineConfig } from "drizzle-kit";

function getDrizzleConnectionString(): string {
  let rawUrl = process.env.DATABASE_URL || "";
  if (rawUrl.includes("db.axaprqkzogwnchhikwyj.supabase.co")) {
    rawUrl = rawUrl
      .replace("db.axaprqkzogwnchhikwyj.supabase.co:5432", "aws-0-ap-southeast-1.pooler.supabase.com:6543")
      .replace("db.axaprqkzogwnchhikwyj.supabase.co", "aws-0-ap-southeast-1.pooler.supabase.com");
    if (rawUrl.includes("postgresql://postgres:") && !rawUrl.includes("postgres.axaprqkzogwnchhikwyj:")) {
      rawUrl = rawUrl.replace("postgresql://postgres:", "postgresql://postgres.axaprqkzogwnchhikwyj:");
    }
  }
  return rawUrl;
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: getDrizzleConnectionString(),
  },
  verbose: true,
  strict: true,
});
