"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle common auth errors or offer smooth login fallback
        setErrorMessage(error.message || "Invalid authentication credentials");
        setLoading(false);
        return;
      }

      // Set admin session cookie for SSR middleware
      document.cookie = "rcms_admin_session=authenticated; path=/; max-age=86400; SameSite=Lax";
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred during authentication");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Bot className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            RCMS Authentication
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your credentials to access the Robotics Club Management System
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@robotics.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 flex-shrink-0" />
            <span>Production Supabase Auth Session Active</span>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              "Authenticating..."
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="text-center text-[11px] text-muted-foreground border-t border-border pt-4">
          Robotics Club Management System | Production Auth v1.0
        </div>
      </div>
    </main>
  );
}
