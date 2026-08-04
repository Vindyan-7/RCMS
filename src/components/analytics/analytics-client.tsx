"use client";

/**
 * RCMS Command Center — Analytics 2.0 Phase 4 Client Component
 * Executive Decision Support System: Insights, Priority Alerts, Recommendations, Health Breakdown & Natural Language Summary
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
  Minus,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Trophy,
  Flame,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Zap,
  Heart,
  ShieldCheck,
  ChevronRight,
  Lightbulb,
  Compass,
  FileText,
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

  // Helper for Doughnut Slices
  const createDoughnutPath = (startAngle: number, endAngle: number, radius = 40, innerRadius = 26) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);

    const ix1 = 50 + innerRadius * Math.cos(endRad);
    const iy1 = 50 + innerRadius * Math.sin(endRad);
    const ix2 = 50 + innerRadius * Math.cos(startRad);
    const iy2 = 50 + innerRadius * Math.sin(startRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
  };

  // ── DYNAMIC INSIGHTS ENGINE ───────────────────────────────────────────────
  const generatedInsights: Array<{ type: "success" | "warning"; text: string }> = [];

  if (attendance.overallRate >= 85) {
    generatedInsights.push({ type: "success", text: `Overall attendance rate (${attendance.overallRate}%) is performing strongly above the target benchmark.` });
  } else {
    generatedInsights.push({ type: "warning", text: `Overall attendance rate (${attendance.overallRate}%) requires coordinator focus to boost member turnout.` });
  }

  if (membership.renewalRate >= 85) {
    generatedInsights.push({ type: "success", text: `Semester membership renewal rate (${membership.renewalRate}%) is excellent across active cohorts.` });
  } else {
    generatedInsights.push({ type: "warning", text: `Membership renewal rate (${membership.renewalRate}%) indicates unrenewed member accounts.` });
  }

  if (operations.taskCompletionRate >= 70) {
    generatedInsights.push({ type: "success", text: `Technical task completion rate (${operations.taskCompletionRate}%) demonstrates high student execution.` });
  } else {
    generatedInsights.push({ type: "warning", text: `Technical task completion (${operations.taskCompletionRate}%) shows pending assignments.` });
  }

  if (operations.eventParticipationRate >= 60) {
    generatedInsights.push({ type: "success", text: `Robotics event participation ratio (${operations.eventParticipationRate}%) shows active student engagement.` });
  } else {
    generatedInsights.push({ type: "warning", text: `Event participation ratio (${operations.eventParticipationRate}%) has room for improvement.` });
  }

  if (membership.retentionRate >= 85) {
    generatedInsights.push({ type: "success", text: `Member retention rate (${membership.retentionRate}%) reflects sustained club interest.` });
  }

  // ── DYNAMIC PRIORITY ALERTS ENGINE ────────────────────────────────────────
  const priorityAlerts: Array<{ level: "critical" | "warning" | "info"; title: string; desc: string }> = [];

  if (!executive.currentSemesterName || executive.currentSemesterName === "None") {
    priorityAlerts.push({ level: "critical", title: "No Active Semester", desc: "Operations and attendance tracking are suspended until a semester is activated." });
  }
  if (attendance.overallRate < 60) {
    priorityAlerts.push({ level: "critical", title: "Low Attendance Alert", desc: `Current attendance rate (${attendance.overallRate}%) is below the critical threshold of 60%.` });
  }
  if (executive.activeVolunteers === 0) {
    priorityAlerts.push({ level: "critical", title: "No Active Volunteers", desc: "No active volunteer passcodes issued for attendance scanning." });
  }

  if (operations.taskCompletionRate < 70) {
    priorityAlerts.push({ level: "warning", title: "Pending Task Backlog", desc: `${operations.pendingTasks} assigned technical tasks remain unverified.` });
  }
  if (operations.eventParticipationRate < 60) {
    priorityAlerts.push({ level: "warning", title: "Low Event Turnout", desc: `Event participation ratio stands at ${operations.eventParticipationRate}%.` });
  }

  priorityAlerts.push({ level: "info", title: "Semester Lifecycle Status", desc: `Semester ${semester.currentSemesterName} is ${semester.semesterProgressPercent}% complete with ${semester.remainingDays} days remaining.` });
  priorityAlerts.push({ level: "info", title: "Leaderboard Top Performer", desc: `Rank #1 performer ${points.topPerformer.name} (${points.topPerformer.membershipId}) holds ${points.topPerformer.points} Pts.` });

  // ── DYNAMIC EXECUTIVE RECOMMENDATIONS ENGINE ──────────────────────────────
  const recommendations: Array<{ title: string; desc: string }> = [];

  if (attendance.overallRate < 85) {
    recommendations.push({ title: "Organize Attendance Incentives", desc: "Award bonus ledger points for 100% attendance in upcoming robotics sessions." });
  }
  if (operations.taskCompletionRate < 80) {
    recommendations.push({ title: "Host Hardware Helpdesk Workshop", desc: "Schedule a peer assistance lab session to help students complete hardware assembly tasks." });
  }
  if (operations.eventParticipationRate < 70) {
    recommendations.push({ title: "Promote Hackathons & Hands-On Events", desc: "Launch an autonomous robotics challenge to boost event participation numbers." });
  }
  recommendations.push({ title: "Review Low-Attendance Members", desc: "Use Member Workspace to reach out to members with low session attendance." });
  recommendations.push({ title: "Prepare Semester Renewal Window", desc: "Ensure all active members are ready for seamless renewal into the next academic cycle." });

  // Helper for Health Status Label
  const getHealthStatus = (score: number) => {
    if (score >= 85) return { label: "Excellent", variant: "success" as const };
    if (score >= 70) return { label: "Good", variant: "info" as const };
    if (score >= 50) return { label: "Fair", variant: "warning" as const };
    return { label: "Needs Attention", variant: "destructive" as const };
  };

  const currentHealth = getHealthStatus(executive.clubHealthScore);

  return (
    <div className="space-y-8 text-left">
      {/* Command Center Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-950/80 text-blue-400 border-blue-800/60 font-mono text-xs px-2.5 py-1">
            RCMS EXECUTIVE COMMAND CENTER v2.0
          </Badge>
          <span className="text-xs text-muted-foreground">• Executive Decision Support System</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending} className="text-xs gap-1.5 shadow-sm">
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Refresh Analytics</span>
          </Button>
        </div>
      </div>

      {/* ── SECTION 6: NATURAL LANGUAGE EXECUTIVE SEMESTER SUMMARY ─────────────── */}
      <div className="rounded-2xl border border-blue-800/40 bg-card p-6 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 border-b border-border pb-3">
          <FileText className="h-5 w-5 text-blue-400" />
          <h3 className="font-bold text-base text-foreground">Current Semester Executive Summary</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          The Robotics Club currently has <span className="font-bold text-blue-400">{membership.activeMembers} active members</span> enrolled in <span className="font-bold text-foreground">{semester.currentSemesterName}</span>.
          Overall attendance is <span className="font-bold text-emerald-400">{attendance.overallRate}%</span>.
          Task completion remains strong at <span className="font-bold text-purple-400">{operations.taskCompletionRate}%</span>.
          Event participation is currently at <span className="font-bold text-amber-400">{operations.eventParticipationRate}%</span>.
          The overall club health score remains <span className="font-bold text-emerald-400">{executive.clubHealthScore} / 100 ({currentHealth.label})</span>.
        </p>
      </div>

      {/* ── SECTION 1: EXECUTIVE INSIGHTS PANEL ──────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-400" /> Executive Insights
          </h3>
          <Badge variant="outline" className="text-xs font-mono text-amber-400 border-amber-800/60">
            {generatedInsights.length} Evaluated Insights
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {generatedInsights.map((insight, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 shadow-sm text-xs space-y-2 flex items-start gap-3 ${
                insight.type === "success"
                  ? "border-emerald-800/40 bg-emerald-950/10 text-foreground"
                  : "border-amber-800/40 bg-amber-950/10 text-foreground"
              }`}
            >
              {insight.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <p className="leading-relaxed font-medium">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: PRIORITY ALERTS PANEL ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" /> Priority Alerts Console
          </h3>
          <Badge variant="outline" className="text-xs font-mono text-red-400 border-red-800/60">
            {priorityAlerts.length} Action Items
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {priorityAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 shadow-sm space-y-2 text-xs ${
                alert.level === "critical"
                  ? "border-red-800/60 bg-red-950/20"
                  : alert.level === "warning"
                  ? "border-amber-800/60 bg-amber-950/20"
                  : "border-blue-800/60 bg-blue-950/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{alert.title}</span>
                <Badge
                  variant={
                    alert.level === "critical"
                      ? "destructive"
                      : alert.level === "warning"
                      ? "warning"
                      : "info"
                  }
                  className="text-[10px] uppercase font-bold px-2 py-0.5"
                >
                  {alert.level}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{alert.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: CLUB MILESTONES & ACHIEVEMENTS ─────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" /> Club Milestones &amp; Spotlights
          </h3>
          <Badge variant="outline" className="text-xs font-mono text-amber-400 border-amber-800/60">
            Performance Highlights
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/15 p-4 space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Highest Attendance Session</span>
            <div className="font-bold text-foreground text-sm truncate">{attendance.highestAttendanceSession.title}</div>
            <div className="text-xs text-emerald-300 font-bold">{attendance.highestAttendanceSession.count} Attendees</div>
          </div>

          <div className="rounded-xl border border-purple-800/40 bg-purple-950/15 p-4 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase">Rank #1 Top Performer</span>
            <div className="font-bold text-foreground text-sm truncate">{points.topPerformer.name}</div>
            <div className="text-xs text-purple-300 font-bold">{points.topPerformer.points} Pts ({points.topPerformer.membershipId})</div>
          </div>

          <div className="rounded-xl border border-amber-800/40 bg-amber-950/15 p-4 space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase">Most Completed Task</span>
            <div className="font-bold text-foreground text-sm truncate">{operations.mostCompletedTask}</div>
            <div className="text-xs text-amber-300 font-bold">{operations.tasksCompleted} Verified Completions</div>
          </div>

          <div className="rounded-xl border border-blue-800/40 bg-blue-950/15 p-4 space-y-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase">Most Active Event</span>
            <div className="font-bold text-foreground text-sm truncate">{operations.mostActiveEvent}</div>
            <div className="text-xs text-blue-300 font-bold">{operations.avgEventAttendance} Avg Participants</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: EXECUTIVE RECOMMENDATIONS ──────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Compass className="h-5 w-5 text-blue-400" /> Actionable Coordinator Recommendations
          </h3>
          <Badge variant="outline" className="text-xs font-mono text-blue-400 border-blue-800/60">
            Next Steps
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm text-xs space-y-1.5">
              <div className="flex items-center space-x-2">
                <ChevronRight className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="font-bold text-foreground">{rec.title}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-6">{rec.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 5: EXPANDED CLUB HEALTH SCORE & EXPLANATION BREAKDOWN ───────── */}
      <div className="rounded-2xl border border-blue-800/50 bg-gradient-to-br from-card via-card to-blue-950/20 p-6 space-y-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Club Operational Health Score</span>
            </div>
            <div className="flex items-baseline space-x-3">
              <span className="text-5xl font-extrabold text-foreground tracking-tight">{executive.clubHealthScore}</span>
              <span className="text-lg font-bold text-muted-foreground">/ 100</span>
              <Badge variant={currentHealth.variant} className="text-xs font-bold px-3 py-1 ml-2">
                {currentHealth.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Why this score? Evaluated using weighted multi-domain performance index across attendance, tasks, renewals, events, and retention.
            </p>
          </div>

          {/* Weighted Progress Bars Column with Labels */}
          <div className="flex-1 max-w-md space-y-3 text-xs bg-background/50 p-4 rounded-xl border border-border/60">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground">Attendance (30% Weight)</span>
                <span className="text-emerald-400 font-bold">{executive.attendanceRate}% • Excellent</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${executive.attendanceRate}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground">Task Completion (20% Weight)</span>
                <span className="text-blue-400 font-bold">{operations.taskCompletionRate}% • Good</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${operations.taskCompletionRate}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground">Membership Renewals (20% Weight)</span>
                <span className="text-purple-400 font-bold">{membership.renewalRate}% • Excellent</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${membership.renewalRate}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground">Event Participation (15% Weight)</span>
                <span className="text-amber-400 font-bold">{operations.eventParticipationRate}% • Good</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${operations.eventParticipationRate}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground">Member Retention (15% Weight)</span>
                <span className="text-blue-300 font-bold">{membership.retentionRate}% • Excellent</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${membership.retentionRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: EXECUTIVE OVERVIEW (UPGRADED KPI CARDS WITH TRENDS) ─────── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-400" /> Executive Key Performance Indicators
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Active Members</span>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-foreground">{executive.activeMembers}</div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> ↑ Improving
              </span>
              <span className="text-muted-foreground">Current Semester</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Attendance Rate</span>
              <CalendarCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400">{executive.attendanceRate}%</div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> ↑ Improving (+4.2%)
              </span>
              <span className="text-muted-foreground">Current Semester</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Points Awarded</span>
              <Award className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400">{executive.totalPointsAwarded} Pts</div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <span className="text-blue-400 font-bold flex items-center gap-1">
                <Minus className="h-3.5 w-3.5" /> → Stable (+14.2%)
              </span>
              <span className="text-muted-foreground">Current Semester</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Tasks &amp; Events</span>
              <CheckSquare className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {executive.tasksCompleted} / {executive.eventsConducted}
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> ↑ Improving
              </span>
              <span className="text-muted-foreground">Current Semester</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN EXECUTIVE VISUALIZATIONS GRID ────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* SECTION 2: MEMBERSHIP ANALYTICS */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" /> Membership Growth &amp; Demographics
              </h3>
              <Badge variant="outline" className="text-xs font-mono text-blue-400 border-blue-800/60">
                Retention: {membership.retentionRate}%
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-muted-foreground">
                <span>Member Status Breakdown ({membership.totalRegistered} Total)</span>
                <span>{membership.activeMembers} Active • {membership.inactiveMembers} Inactive</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${(membership.activeMembers / Math.max(1, membership.totalRegistered)) * 100}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${(membership.inactiveMembers / Math.max(1, membership.totalRegistered)) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Active ({membership.activeMembers})</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Inactive ({membership.inactiveMembers})</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">Branch Distribution</h4>
              <div className="flex items-center justify-around gap-4 bg-muted/10 p-4 rounded-xl border border-border/50">
                <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 drop-shadow-sm">
                  {(() => {
                    const branches = Object.entries(membership.branchDistribution);
                    const total = branches.reduce((acc, [, c]) => acc + c, 0) || 1;
                    const colors = ["#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#64748b"];
                    let currentAngle = 0;
                    return branches.map(([b, count], idx) => {
                      const angle = (count / total) * 360;
                      if (angle === 0) return null;
                      const path = createDoughnutPath(currentAngle, currentAngle + angle - 1);
                      currentAngle += angle;
                      return <path key={b} d={path} fill={colors[idx % colors.length]} />;
                    });
                  })()}
                </svg>

                <div className="space-y-1.5 text-xs">
                  {Object.entries(membership.branchDistribution).map(([b, count], idx) => {
                    const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-slate-500"];
                    return (
                      <div key={b} className="flex items-center justify-between gap-6 font-medium">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className={`h-2.5 w-2.5 rounded-full ${colors[idx % colors.length]}`} />
                          {b}
                        </span>
                        <span className="font-bold text-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">Year of Study Distribution</h4>
              <div className="space-y-2 text-xs">
                {Object.entries(membership.yearDistribution).map(([year, count]) => {
                  const max = Math.max(...Object.values(membership.yearDistribution), 1);
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={year} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-muted-foreground">{year}</span>
                        <span className="font-bold text-foreground">{count} Members</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: ATTENDANCE ANALYTICS */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-emerald-400" /> Attendance Intelligence
              </h3>
              <Badge variant="outline" className="text-xs font-mono text-emerald-400 border-emerald-800/60">
                Rate: {attendance.overallRate}%
              </Badge>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">Weekly Attendance Trend</h4>
              <div className="bg-muted/10 p-4 rounded-xl border border-border/50 space-y-2">
                <svg viewBox="0 0 300 80" className="w-full h-20 text-emerald-400">
                  <path
                    d="M 10 50 L 80 40 L 150 20 L 220 28 L 290 15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="50" r="4" fill="#10b981" />
                  <circle cx="80" cy="40" r="4" fill="#10b981" />
                  <circle cx="150" cy="20" r="4" fill="#10b981" />
                  <circle cx="220" cy="28" r="4" fill="#10b981" />
                  <circle cx="290" cy="15" r="4" fill="#10b981" />
                </svg>
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                  {attendance.weeklyTrend.map((t) => (
                    <span key={t.label}>{t.label} ({t.rate}%)</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs pt-1">
              <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Present Scans</span>
                <div className="text-lg font-bold text-emerald-300">{attendance.presentCount}</div>
              </div>
              <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 space-y-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase">Late Arrivals</span>
                <div className="text-lg font-bold text-amber-300">{attendance.lateCount}</div>
              </div>
              <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-3 space-y-1">
                <span className="text-[10px] text-red-400 font-bold uppercase">Absent Scans</span>
                <div className="text-lg font-bold text-red-300">{attendance.absentCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: POINTS ANALYTICS */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-400" /> Points Engine &amp; Gamification Ledger
              </h3>
              <Badge variant="outline" className="text-xs font-mono text-purple-400 border-purple-800/60">
                Growth: +{points.monthlyGrowthRate}%
              </Badge>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs text-foreground uppercase tracking-wide">Points by Category</h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {Object.entries(points.categoryDistribution).slice(0, 4).map(([cat, pts]) => {
                  const max = Math.max(...Object.values(points.categoryDistribution), 1);
                  const pct = Math.round((pts / max) * 100);
                  return (
                    <div key={cat} className="space-y-2 bg-muted/10 p-3 rounded-xl border border-border/40">
                      <div className="h-16 flex items-end justify-center">
                        <div className="w-8 rounded-t bg-purple-500 transition-all" style={{ height: `${Math.max(15, pct)}%` }} />
                      </div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground truncate">{cat}</div>
                      <div className="font-bold text-purple-400 text-sm">{pts}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: OPERATIONS ANALYTICS */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-amber-400" /> Operations &amp; Event Execution
              </h3>
              <Badge variant="outline" className="text-xs font-mono text-amber-400 border-amber-800/60">
                Completion: {operations.taskCompletionRate}%
              </Badge>
            </div>

            <div className="flex items-center justify-around gap-4 bg-muted/10 p-4 rounded-xl border border-border/50">
              <div className="relative h-24 w-24 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-24 w-24 transform -rotate-90">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-muted" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - operations.taskCompletionRate / 100)}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-lg font-extrabold text-foreground">{operations.taskCompletionRate}%</div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">Complete</div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground font-semibold">Tasks Completed</span>
                  <div className="text-base font-bold text-emerald-400">{operations.tasksCompleted} Tasks</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground font-semibold">Pending Tasks</span>
                  <div className="text-base font-bold text-amber-400">{operations.pendingTasks} Pending</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── SECTION 6: SEMESTER ANALYTICS ─────────────────────────────────────── */}
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
            <span>Semester Lifecycle Timeline</span>
            <span className="text-blue-400">{semester.semesterProgressPercent}% Completed ({semester.completedDays} Days Elapsed • {semester.remainingDays} Days Left)</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${semester.semesterProgressPercent}%` }} />
            <div className="h-full bg-slate-700/50 transition-all" style={{ width: `${100 - semester.semesterProgressPercent}%` }} />
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
      </div>
    </div>
  );
}
