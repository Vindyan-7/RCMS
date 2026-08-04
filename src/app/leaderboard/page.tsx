import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { getPublicLeaderboardAction } from "@/actions/public/public_leaderboard.actions";
import { PublicLeaderboardClient } from "@/components/public/public-leaderboard-client";
import { Trophy, ShieldCheck, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicLeaderboardPage() {
  const leaderboardRes = await getPublicLeaderboardAction();
  const leaderboardItems = leaderboardRes.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Banner */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Public Leaderboard Rankings
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Official member standings, points achievements, task completions, and attendance metrics.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
              <span className="flex items-center space-x-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Authoritative Point Ledger</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center space-x-1.5 font-medium">
                <Award className="h-4 w-4 text-blue-600" />
                <span>Tier Achievements (Gold / Silver / Bronze)</span>
              </span>
            </div>
          </div>

          {/* Interactive Leaderboard Client */}
          <PublicLeaderboardClient initialLeaderboard={leaderboardItems} />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
