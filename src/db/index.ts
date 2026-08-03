import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:Robotics%40club%402026@db.axaprqkzogwnchhikwyj.supabase.co:5432/postgres";
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://axaprqkzogwnchhikwyj.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4YXBycWt6b2d3bmNoaGlrd3lqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTExODkzMCwiZXhwIjoyMTAwNjk0OTMwfQ.PGs5ytdpE9-0VK90-itxkuFZUg_1m6k0eU0jTixKHF8";

const client = postgres(connectionString, { prepare: false, ssl: "require" });
export const drizzleDb = drizzle(client, { schema });
export const supabase = createClient(supabaseUrl, supabaseKey);

export const db: any = new Proxy(drizzleDb, {
  get(target, prop, receiver) {
    if (prop === "from") {
      return supabase.from.bind(supabase);
    }
    if (prop === "auth") {
      return supabase.auth;
    }
    if (prop === "storage") {
      return supabase.storage;
    }
    if (prop === "rpc") {
      return supabase.rpc.bind(supabase);
    }
    const val = Reflect.get(target, prop, receiver);
    if (typeof val === "function") {
      return val.bind(target);
    }
    return val;
  },
});

export function toCamelCase<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCase(v)) as any;
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => toSnakeCase(v));
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}
