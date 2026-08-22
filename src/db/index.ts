import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import * as schema from "./schema";

/**
 * Sanitizes connection string to ensure IPv4 pooler compatibility on Vercel / serverless deployments.
 * Direct Supabase host "db.<ref>.supabase.co:5432" is IPv6-only and fails with ENOTFOUND on Vercel.
 * Transformed to Supavisor Pooler "aws-0-[region].pooler.supabase.com:6543" with user "postgres.<ref>".
 */
function getSanitizedConnectionString(): string {
  let rawUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_DATABASE_URL ||
    "";

  if (!rawUrl) return "";

  if (rawUrl.includes("db.axaprqkzogwnchhikwyj.supabase.co")) {
    rawUrl = rawUrl
      .replace("db.axaprqkzogwnchhikwyj.supabase.co:5432", "aws-0-ap-southeast-1.pooler.supabase.com:6543")
      .replace("db.axaprqkzogwnchhikwyj.supabase.co", "aws-0-ap-southeast-1.pooler.supabase.com");
    if (rawUrl.includes("postgresql://postgres:") && !rawUrl.includes("postgres.axaprqkzogwnchhikwyj:")) {
      rawUrl = rawUrl.replace("postgresql://postgres:", "postgresql://postgres.axaprqkzogwnchhikwyj:");
    }
    if (rawUrl.includes("postgres://postgres:") && !rawUrl.includes("postgres.axaprqkzogwnchhikwyj:")) {
      rawUrl = rawUrl.replace("postgres://postgres:", "postgres://postgres.axaprqkzogwnchhikwyj:");
    }
  } else if (rawUrl.match(/db\.[a-z0-9]+\.supabase\.co/i)) {
    const refMatch = rawUrl.match(/db\.([a-z0-9]+)\.supabase\.co/i);
    if (refMatch && refMatch[1]) {
      const ref = refMatch[1];
      rawUrl = rawUrl
        .replace(`db.${ref}.supabase.co:5432`, `aws-0-ap-southeast-1.pooler.supabase.com:6543`)
        .replace(`db.${ref}.supabase.co`, `aws-0-ap-southeast-1.pooler.supabase.com`);
      if (rawUrl.includes("postgresql://postgres:") && !rawUrl.includes(`postgres.${ref}:`)) {
        rawUrl = rawUrl.replace("postgresql://postgres:", `postgresql://postgres.${ref}:`);
      }
      if (rawUrl.includes("postgres://postgres:") && !rawUrl.includes(`postgres.${ref}:`)) {
        rawUrl = rawUrl.replace("postgres://postgres:", `postgres://postgres.${ref}:`);
      }
    }
  }

  return rawUrl;
}

const connectionString = getSanitizedConnectionString();
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const drizzleDb = drizzle(client, { schema });
export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (url: RequestInfo | URL, init?: RequestInit) => fetch(url, { ...init, cache: "no-store" }),
  },
});

export const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NODE_ENV === "production"
);

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
