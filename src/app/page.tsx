import Link from "next/link";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { getPublicLeaderboardAction } from "@/actions/public/public_leaderboard.actions";
import { Bot, Trophy, Cpu, Zap, ArrowRight, Award, Layers, Users, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const leaderboardRes = await getPublicLeaderboardAction();
  const topMembers = (leaderboardRes.data || []).slice(0, 3);
  const totalMembers = leaderboardRes.data?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200 py-12 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-semibold text-blue-700">
                <Zap className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Student Activity Council</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15]">
                Robotics Club <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Innovation & Engineering Platform
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto px-2">
                Building autonomous robots, embedded control systems, and high-performance hardware for national competitions, hackathons, and research projects.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 sm:pt-4">
                <Link
                  href="/leaderboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-all hover:scale-[1.02] min-h-[48px]"
                >
                  <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>View Public Leaderboard</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>

                <Link
                  href="/about"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-100 border border-slate-200 px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors min-h-[48px]"
                >
                  <Bot className="h-4 w-4 text-slate-600 shrink-0" />
                  <span>Explore Technical Wings</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Live Stats Bar */}
        <section className="bg-slate-900 text-white py-8 sm:py-10 border-b border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">{totalMembers > 0 ? totalMembers : 17}</p>
                <p className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Active Members</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400">4</p>
                <p className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Technical Wings</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</p>
                <p className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Hands-on Engineering</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">SAC</p>
                <p className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Student Council</p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Wings Section */}
        <section className="py-12 sm:py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Core Technical Domains
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                Specialized wings collaborating on robotics competitions, hardware design, embedded firmware, and autonomous AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Hardware & CAD</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  3D CAD modeling, chassis fabrication, PCB layout design, and structural stress testing for competitive robots.
                </p>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Embedded Systems</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Microcontroller programming (ESP32, STM32, Arduino), motor drivers, real-time sensor integration, and power management.
                </p>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Autonomous Software</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ROS2 framework, kinematic path planning, obstacle avoidance algorithms, and telemetry control dashboards.
                </p>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">AI & Computer Vision</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  OpenCV object recognition, camera tracking, LiDAR mapping, and machine learning models for intelligent navigation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Performers Spotlight */}
        {topMembers.length > 0 && (
          <section className="py-12 sm:py-16 bg-white border-t border-slate-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 sm:mb-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Leaderboard Spotlight</h2>
                  <p className="text-xs text-slate-500">Top active contributors in points & event achievements</p>
                </div>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors py-1 min-h-[44px]"
                >
                  <span>View Full Rankings</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {topMembers.map((m) => (
                  <div
                    key={m.membershipId}
                    className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 min-w-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xl shrink-0">{m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : "🥉"}</span>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 shrink-0">
                        {m.totalPoints} Pts
                      </span>
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-base font-bold text-slate-900 truncate">{m.memberName}</h4>
                      <p className="text-xs font-mono text-slate-500 truncate">{m.membershipId}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/60 pt-3 gap-2">
                      <span className="truncate">Branch: <strong className="text-slate-800">{m.branch}</strong></span>
                      <span className="shrink-0">Tasks: <strong className="text-slate-800">{m.tasksCompleted}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
