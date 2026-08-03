import { getExecutiveDashboardMetricsAction, getKpiMetricsAction, getSystemInsightsAction } from "@/actions/intelligence";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Users, CalendarCheck, CheckSquare, Box, DollarSign, Activity, AlertTriangle, Info, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let metrics = {
    totalMembers: 0,
    activeMembers: 0,
    totalAttendanceSessions: 0,
    totalAttendanceScans: 0,
    totalTasksCompleted: 0,
    totalEvents: 0,
    totalInventoryItems: 0,
    activeBorrowings: 0,
    financialNetBalance: 0,
  };

  let kpis = {
    memberActiveRatioPct: 0,
    averageAttendancePerSession: 0,
    taskCompletionVolume: 0,
    inventoryUtilizationPct: 0,
  };

  let insights: any[] = [];

  try {
    const results = await Promise.allSettled([
      getExecutiveDashboardMetricsAction(),
      getKpiMetricsAction(),
      getSystemInsightsAction(),
    ]);

    if (results[0].status === "fulfilled" && results[0].value?.data) {
      metrics = { ...metrics, ...results[0].value.data };
    }
    if (results[1].status === "fulfilled" && results[1].value?.data) {
      kpis = { ...kpis, ...results[1].value.data };
    }
    if (results[2].status === "fulfilled" && results[2].value?.data) {
      insights = results[2].value.data;
    }
  } catch (err) {
    // Fail-safe default metrics
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Executive Intelligence Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time operational summary across all Robotics Club modules
          </p>
        </div>
        <Badge variant="success" className="px-3 py-1 text-sm font-medium">
          Live Backend Connected
        </Badge>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Club Members"
          value={metrics.totalMembers}
          subtitle={`${metrics.activeMembers} currently active members`}
          icon={<Users className="h-6 w-6" />}
          trend={{ value: `${kpis.memberActiveRatioPct}% Active`, positive: true }}
        />
        <StatCard
          title="Attendance Sessions"
          value={metrics.totalAttendanceSessions}
          subtitle={`${metrics.totalAttendanceScans} total scans recorded`}
          icon={<CalendarCheck className="h-6 w-6" />}
        />
        <StatCard
          title="Tasks & Events"
          value={metrics.totalTasksCompleted + metrics.totalEvents}
          subtitle={`${metrics.totalTasksCompleted} tasks completed`}
          icon={<CheckSquare className="h-6 w-6" />}
        />
        <StatCard
          title="Inventory Items"
          value={metrics.totalInventoryItems}
          subtitle={`${metrics.activeBorrowings} active borrowings`}
          icon={<Box className="h-6 w-6" />}
          trend={{ value: `${kpis.inventoryUtilizationPct}% Utilized`, positive: false }}
        />
      </div>

      {/* KPI Indicators & Finance Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Member Active Ratio</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {kpis.memberActiveRatioPct}%
          </div>
          <p className="text-xs text-muted-foreground">
            Calculated dynamically based on active semester memberships.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Task Completion Volume</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {kpis.taskCompletionVolume}
          </div>
          <p className="text-xs text-muted-foreground">
            Total member task completions verified by team leaders.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold text-foreground">Financial Net Balance</h3>
          </div>
          <div className="text-3xl font-bold text-emerald-500">
            ₹{metrics.financialNetBalance.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Derived from immutable transaction ledger postings.
          </p>
        </div>
      </div>

      {/* Automated System Insights */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-semibold text-foreground flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Automated System Insights</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            Intelligence Engine
          </span>
        </div>

        {insights.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            All system parameters operating within normal thresholds.
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="flex items-start space-x-3 rounded-xl border border-border bg-background p-4 shadow-sm"
              >
                {insight.type === "warning" || insight.type === "alert" ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
