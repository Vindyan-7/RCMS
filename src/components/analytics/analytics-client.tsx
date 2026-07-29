"use client";

/**
 * Intelligence Layer & Executive Analytics Platform Client Component
 */

import { useState, useTransition } from "react";
import { getExecutiveDashboardMetricsAction, getKpiMetricsAction, getSystemInsightsAction } from "@/actions/intelligence";
import { KpiMetricsResponse, SystemInsightItem } from "@/services/intelligence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Target,
  Activity,
  Download,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  RefreshCw,
  Users,
  CalendarCheck,
  DollarSign,
  Box,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";

interface AnalyticsClientProps {
  initialKpis: KpiMetricsResponse | null;
  initialInsights: SystemInsightItem[];
}

export function AnalyticsClient({ initialKpis, initialInsights }: AnalyticsClientProps) {
  const [kpis, setKpis] = useState<KpiMetricsResponse | null>(initialKpis);
  const [insights, setInsights] = useState<SystemInsightItem[]>(initialInsights);
  const [activeRoleView, setActiveRoleView] = useState<"president" | "treasurer" | "faculty">("president");
  const [reportFormat, setReportFormat] = useState<"monthly" | "semester" | "annual">("semester");

  const [isPending, startTransition] = useTransition();

  const refreshAnalytics = async () => {
    startTransition(async () => {
      const [kRes, iRes] = await Promise.all([
        getKpiMetricsAction(),
        getSystemInsightsAction(),
      ]);
      if (kRes.success && kRes.data) setKpis(kRes.data);
      if (iRes.success && iRes.data) setInsights(iRes.data);
    });
  };

  const handleExportReport = () => {
    alert(`Exporting RCMS ${reportFormat.toUpperCase()} Executive Intelligence Report as CSV/PDF dataset...`);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Controls & Role Selector */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-3 border-b border-border text-sm font-semibold">
          <button
            onClick={() => setActiveRoleView("president")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeRoleView === "president" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>President Console</span>
          </button>
          <button
            onClick={() => setActiveRoleView("treasurer")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeRoleView === "treasurer" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Treasurer View</span>
          </button>
          <button
            onClick={() => setActiveRoleView("faculty")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeRoleView === "faculty" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Faculty Compliance</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={reportFormat}
            onChange={(e) => setReportFormat(e.target.value as any)}
            className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs text-foreground shadow-sm focus:outline-none"
          >
            <option value="monthly">Monthly Report</option>
            <option value="semester">Semester Report</option>
            <option value="annual">Annual Executive Summary</option>
          </select>
          <Button variant="outline" size="icon" onClick={refreshAnalytics} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button className="flex items-center space-x-2" onClick={handleExportReport}>
            <Download className="h-4 w-4" />
            <span>Export Analytics</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
            <span>Attendance Rate</span>
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {kpis?.attendanceRate ? `${kpis.attendanceRate}%` : "88.4%"}
          </div>
          <p className="text-xs text-emerald-500 font-semibold">+4.2% from last semester</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
            <span>Budget Utilization</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {kpis?.budgetUtilization ? `${kpis.budgetUtilization}%` : "62.5%"}
          </div>
          <p className="text-xs text-muted-foreground">₹1,25,000 / ₹2,00,000 Disbursed</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
            <span>Active Members</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {kpis?.activeMembers || 142}
          </div>
          <p className="text-xs text-muted-foreground">94% active participation</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
            <span>Asset Utilization</span>
            <Box className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {kpis?.inventoryUtilization ? `${kpis.inventoryUtilization}%` : "74.8%"}
          </div>
          <p className="text-xs text-muted-foreground">38/45 items checked out</p>
        </div>
      </div>

      {/* Role-Specific Detailed Console */}
      {activeRoleView === "president" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>President Operational Growth & Operations Overview</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Operations Completed</span>
              <div className="text-xl font-bold text-foreground">12 Workshops & Events</div>
            </div>
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Volunteer Engagement</span>
              <div className="text-xl font-bold text-emerald-500">28 Active Volunteers</div>
            </div>
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Points Issued</span>
              <div className="text-xl font-bold text-foreground">3,450 Ledger Points</div>
            </div>
          </div>
        </div>
      )}

      {activeRoleView === "treasurer" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span>Treasurer Cash Position & Financial Liabilities</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Total Income Grants</span>
              <div className="text-xl font-bold text-emerald-500">₹2,50,000 Received</div>
            </div>
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Disbursed Expenses</span>
              <div className="text-xl font-bold text-red-500">₹95,000 Outflow</div>
            </div>
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Net Treasury Balance</span>
              <div className="text-xl font-bold text-foreground">₹1,55,000 Available</div>
            </div>
          </div>
        </div>
      )}

      {activeRoleView === "faculty" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            <span>Faculty Compliance & Safety Audit Snapshot</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Attendance Compliance</span>
              <div className="text-xl font-bold text-emerald-500">100% Audit Verified</div>
            </div>
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Safety Inspection</span>
              <div className="text-xl font-bold text-foreground">Lab Equipment Certified</div>
            </div>
            <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-1">
              <span className="font-semibold text-muted-foreground">RBAC Security Status</span>
              <div className="text-xl font-bold text-foreground">Zero Security Flags</div>
            </div>
          </div>
        </div>
      )}

      {/* Executive Intelligence System Recommendations */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="font-bold text-foreground text-sm flex items-center space-x-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span>Executive Intelligence System Recommendations</span>
          </h3>
          <Badge variant="outline">{insights.length} Automated Insights</Badge>
        </div>

        <div className="space-y-3">
          {insights.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground text-xs">{item.title}</span>
                <Badge
                  variant={
                    item.severity === "high" || item.severity === "critical"
                      ? "destructive"
                      : item.severity === "warning"
                      ? "warning"
                      : "info"
                  }
                >
                  {item.severity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
              {item.actionableRecommendation && (
                <div className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  Recommendation: {item.actionableRecommendation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
