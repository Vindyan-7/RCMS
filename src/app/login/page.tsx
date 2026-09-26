"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, ShieldCheck, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
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
    <main className="flex min-h-screen items-center justify-center bg-background px-3 sm:px-4 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 rounded-2xl border border-border bg-card p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-2.5 sm:space-y-3">
          <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Bot className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            RCMS Authentication
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your credentials to access the Robotics Club Management System
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@robotics.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-input bg-background px-3.5 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="w-full min-h-[44px] rounded-xl border border-input bg-background px-3.5 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 flex-shrink-0" />
            <span>Production Supabase Auth Session Active</span>
          </div>

          <Button type="submit" className="w-full min-h-[48px] font-bold text-sm touch-manipulation" disabled={loading}>
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

        <div className="flex flex-col items-center gap-3 border-t border-border pt-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors min-h-[40px] px-3 touch-manipulation"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Public Website</span>
          </Link>
          <div className="text-center text-[10px] text-muted-foreground">
            Robotics Club Management System | Production Auth v1.0
          </div>
        </div>
      </div>
    </main>
  );
}
