import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://axaprqkzogwnchhikwyj.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4YXBycWt6b2d3bmNoaGlrd3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTg5MzAsImV4cCI6MjEwMDY5NDkzMH0.LeNfA8Hk9Dae6zG36pE6NFNd1A1YvUEJ2Dj0ig2ViRg";
  return createBrowserClient(url, key, {
    global: {
      fetch: (url: RequestInfo | URL, init?: RequestInit) => fetch(url, { ...init, cache: "no-store" }),
    },
  });
}
