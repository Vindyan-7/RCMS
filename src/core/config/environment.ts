/**
 * Environment Variables Schema & Loader
 */

import { z } from "zod";

// Schema for client-facing variables (safe to compile in browser context)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").default("http://localhost:3000"),
});

// Schema for server-only variables (must not be exposed to client)
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Helper to determine execution context
const isServer = typeof window === "undefined";

function loadConfig() {
  const processEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  // 1. Validate public variables (always validated)
  const clientParsed = clientEnvSchema.safeParse(processEnv);
  if (!clientParsed.success) {
    console.error("❌ Invalid environment variables:", clientParsed.error.format());
    throw new Error("Invalid environment variables");
  }

  // 2. Validate server variables (only validated in server-side context)
  if (isServer) {
    const serverParsed = serverEnvSchema.safeParse(processEnv);
    if (!serverParsed.success) {
      console.error("❌ Invalid server environment variables:", serverParsed.error.format());
      throw new Error("Invalid server environment variables");
    }
    // Return combined config
    return Object.freeze({
      ...clientParsed.data,
      ...serverParsed.data,
      isServer,
    });
  }

  // On client side, return only public variables with placeholders for server vars
  return Object.freeze({
    ...clientParsed.data,
    DATABASE_URL: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
    NODE_ENV: (process.env.NODE_ENV || "development") as "development" | "production" | "test",
    isServer,
  });
}

export const env = loadConfig();
export type EnvironmentConfig = typeof env;
