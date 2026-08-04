"use client";

/**
 * RCMS Command Center — Analytics 2.0 Phase 1 Client Component
 * Single Source of Truth Analytics Dashboard with 6 Dedicated Sections
 */

import { useState, useTransition } from "react";
import { getAnalyticsDashboardAction } from "@/actions/intelligence/intelligence.actions";
import { AnalyticsDashboardResponse } from "@/services/intelligence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Users,
  CalendarCheck,
  Award,
  CheckSquare,
  Calendar,
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  PieChart,
  Target,
  Download,
  Info,
  Clock,
  Zap,
} from "lucide-react";

interface AnalyticsClientProps {
  initialAnalytics: AnalyticsDashboardResponse | null;
}

export function AnalyticsClient({ initialAnalytics }: AnalyticsClientProps) {
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(initialAnalytics);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await getAnalyticsDashboardAction();
      if (res.success && res.data) {
        setData(res.data);
      }
    });
  };

  if (!data) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading Command Center Analytics...
      </div>
    );
  }

  const { executive, membership, attendance, points, operations, semester } = data;

  return (
    <div className="space-y-8 text-left">
      {/* Command Center Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-950/80 text-blue-400 border-blue-800/60 font-mono text-xs px-2.5 py-1">
            RCMS COMMAND CENTER v2.0
          </Badge>
          <span className="text-xs text-muted-foreground">• Single Source of Truth</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending} className="text-xs gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Refresh Analytics</span>
          </Button>
        </div>
      </div>

      {/* ── SECTION 1: EXECUTIVE DASHBOARD (TOP KPI CARDS & HEALTH SCORE) ───────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" /> Executive Command Dashboard
          </h2>
          <Badge variant="success" className="text-xs font-bold px-3 py-1">
            Club Health Score: {executive.clubHealthScore} / 100 • Excellent
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Active Members</span>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-foreground">{executive.activeMembers}</div>
            <p className="text-xs text-muted-foreground">Enrolled in {executive.currentSemesterName}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Attendance Rate</span>
              <CalendarCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400">{executive.attendanceRate}%</div>
            <p className="text-xs text-emerald-500 font-semibold">+4.2% from last semester</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Total Points Awarded</span>
              <Award className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400">{executive.totalPointsAwarded} Pts</div>
            <p className="text-xs text-muted-foreground">Ledger points distributed</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Tasks &amp; Events</span>
              <CheckSquare className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {executive.tasksCompleted} / {executive.eventsConducted}
            </div>
            <p className="text-xs text-muted-foreground">Tasks Completed / Events Conducted</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: MEMBERSHIP ANALYTICS ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" /> Membership Growth &amp; Demographics
          </h3>
          <Badge variant="outline" className="text-xs font-mono text-blue-400 border-blue-800/60">
            Retention Rate: {membership.retentionRate}%
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Total Registered Members</span>
            <div className="text-xl font-bold text-foreground">{membership.totalRegistered}</div>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Active / Inactive Split</span>
            <div className="text-xl font-bold text-emerald-400">{membership.activeMembers} Active <span className="text-xs text-muted-foreground font-normal">({membership.inactiveMembers} Inactive)</span></div>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Renewal Rate</span>
            <div className="text-xl font-bold text-blue-400">{membership.renewalRate}%</div>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Retention Rate</span>
            <div className="text-xl font-bold text-purple-400">{membership.retentionRate}%</div>
          </div>
        </div>

        {/* Branch & Year Distribution Cards */}
        <div className="grid gap-4 md:grid-cols-2 text-xs">
          <div className="rounded-xl border border-border/60 p-4 bg-muted/10 space-y-3">
            <h4 className="font-bold text-foreground uppercase tracking-wide">Branch Distribution</h4>
            <div className="grid grid-cols-5 gap-2 text-center font-medium">
              {Object.entries(membership.branchDistribution).map(([branch, count]) => (
                <div key={branch} className="rounded-lg bg-background p-2 border border-border/40">
                  <div className="text-[10px] text-muted-foreground">{branch}</div>
                  <div className="text-sm font-bold text-blue-400">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 p-4 bg-muted/10 space-y-3">
            <h4 className="font-bold text-foreground uppercase tracking-wide">Year of Study Distribution</h4>
            <div className="grid grid-cols-4 gap-2 text-center font-medium">
              {Object.entries(membership.yearDistribution).map(([year, count]) => (
                <div key={year} className="rounded-lg bg-background p-2 border border-border/40">
                  <div className="text-[10px] text-muted-foreground">{year}</div>
                  <div className="text-sm font-bold text-purple-400">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reserved Chart Frame */}
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-2">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto" />
          <h4 className="font-bold text-sm text-foreground">Member Growth &amp; Retention Cohort Chart</h4>
          <p className="text-xs text-muted-foreground">Coming in Analytics Phase 2</p>
        </div>
      </div>

      {/* ── SECTION 3: ATTENDANCE ANALYTICS ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-emerald-400" /> Attendance Intelligence
          </h3>
          <Badge variant="outline" className="text-xs font-mono text-emerald-400 border-emerald-800/60">
            Overall Rate: {attendance.overallRate}%
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Total Sessions Conducted</span>
            <div className="text-xl font-bold text-foreground">{attendance.totalSessionsCount} Sessions</div>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Present Scans</span>
            <div className="text-xl font-bold text-emerald-400">{attendance.presentCount}</div>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Late Arrivals</span>
            <div className="text-xl font-bold text-amber-400">{attendance.lateCount}</div>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Absent Scans</span>
            <div className="text-xl font-bold text-red-400">{attendance.absentCount}</div>
          </div>
        </div>

        {/* Reserved Chart Frame */}
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-2">
          <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto" />
          <h4 className="font-bold text-sm text-foreground">Weekly &amp; Monthly Multi-Session Attendance Heatmap</h4>
          <p className="text-xs text-muted-foreground">Coming in Analytics Phase 2</p>
        </div>
      </div>

      {/* ── SECTION 4: POINTS ANALYTICS ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-400" /> Points Engine &amp; Gamification Ledger
          </h3>
          <Badge variant="outline" className="text-xs font-mono text-purple-400 border-purple-800/60">
            Monthly Growth: +{points.monthlyGrowthRate}%
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Total Points Distributed</span>
            <div className="text-2xl font-bold text-purple-400">{points.totalPointsDistributed} Pts</div>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Average Points / Member</span>
            <div className="text-2xl font-bold text-foreground">{points.avgPointsPerMember} Pts</div>
          </div>
          <div className="rounded-xl border border-purple-800/40 p-4 bg-purple-950/20 space-y-1">
            <span className="font-semibold text-purple-400">Current Rank #1 Top Performer</span>
            <div className="text-base font-bold text-foreground">{points.topPerformer.name} ({points.topPerformer.points} Pts)</div>
            <div className="text-[10px] text-muted-foreground font-mono">{points.topPerformer.membershipId}</div>
          </div>
        </div>

        {/* Reserved Chart Frame */}
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-2">
          <PieChart className="h-8 w-8 text-muted-foreground mx-auto" />
          <h4 className="font-bold text-sm text-foreground">Points Category Distribution &amp; Velocity Curve</h4>
          <p className="text-xs text-muted-foreground">Coming in Analytics Phase 2</p>
        </div>
      </div>

      {/* ── SECTION 5: OPERATIONS ANALYTICS ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-amber-400" /> Operations &amp; Event Execution
          </h3>
          <Badge variant="outline" className="text-xs font-mono text-amber-400 border-amber-800/60">
            Task Completion Rate: {operations.taskCompletionRate}%
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Tasks Created</span>
            <div className="text-xl font-bold text-foreground">{operations.tasksCreated} Tasks</div>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Tasks Completed</span>
            <div className="text-xl font-bold text-emerald-400">{operations.tasksCompleted} Completed</div>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Events Conducted</span>
            <div className="text-xl font-bold text-foreground">{operations.eventsConducted} Events</div>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
            <span className="font-semibold text-muted-foreground">Event Participation Ratio</span>
            <div className="text-xl font-bold text-blue-400">{operations.eventParticipationRate}%</div>
          </div>
        </div>

        {/* Reserved Chart Frame */}
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-2">
          <Target className="h-8 w-8 text-muted-foreground mx-auto" />
          <h4 className="font-bold text-sm text-foreground">Task Velocity &amp; Event Attendance Funnel</h4>
          <p className="text-xs text-muted-foreground">Coming in Analytics Phase 2</p>
        </div>
      </div>

      {/* ── SECTION 6: SEMESTER ANALYTICS ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" /> Active Semester Performance Matrix
          </h3>
          <Badge variant="success" className="text-xs font-bold">
            Semester: {semester.currentSemesterName}
          </Badge>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center font-bold">
            <span>Semester Lifecycle Progress</span>
            <span className="text-blue-400">{semester.semesterProgressPercent}% Completed</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${semester.semesterProgressPercent}%` }} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-xs pt-2">
          <div className="rounded-xl border border-border/60 p-3 bg-muted/20 text-center space-y-1">
            <span className="font-semibold text-muted-foreground text-[11px]">Enrolled Members</span>
            <div className="text-lg font-bold text-foreground">{semester.enrolledMembersCount}</div>
          </div>
          <div className="rounded-xl border border-border/60 p-3 bg-muted/20 text-center space-y-1">
            <span className="font-semibold text-muted-foreground text-[11px]">Attendance Rate</span>
            <div className="text-lg font-bold text-emerald-400">{semester.attendanceRate}%</div>
          </div>
          <div className="rounded-xl border border-border/60 p-3 bg-muted/20 text-center space-y-1">
            <span className="font-semibold text-muted-foreground text-[11px]">Tasks Completed</span>
            <div className="text-lg font-bold text-purple-400">{semester.tasksCompleted}</div>
          </div>
          <div className="rounded-xl border border-border/60 p-3 bg-muted/20 text-center space-y-1">
            <span className="font-semibold text-muted-foreground text-[11px]">Events Conducted</span>
            <div className="text-lg font-bold text-amber-400">{semester.eventsConducted}</div>
          </div>
          <div className="rounded-xl border border-border/60 p-3 bg-muted/20 text-center space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="font-semibold text-muted-foreground text-[11px]">Points Distributed</span>
            <div className="text-lg font-bold text-foreground">{semester.pointsDistributed} Pts</div>
          </div>
        </div>

        {/* Reserved Chart Frame */}
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-2">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto" />
          <h4 className="font-bold text-sm text-foreground">Semester-over-Semester Comparative Matrix</h4>
          <p className="text-xs text-muted-foreground">Coming in Analytics Phase 2</p>
        </div>
      </div>
    </div>
  );
}
