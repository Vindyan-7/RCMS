"use client";

/**
 * Settings & System Administration Client Component
 */

import { useState, useTransition } from "react";
import { getConfigurationAction, updateConfigurationAction } from "@/actions/settings/configuration.actions";
import { RCMSGlobalConfiguration } from "@/services/settings/configuration.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Clock,
  Award,
  Calendar,
  CheckSquare,
  ShieldCheck,
  Database,
  Save,
  RefreshCw,
  Server,
  Activity,
  FileText,
  HardDrive,
} from "lucide-react";

interface SettingsClientProps {
  initialConfig: RCMSGlobalConfiguration;
}

export function SettingsClient({ initialConfig }: SettingsClientProps) {
  const [config, setConfig] = useState<RCMSGlobalConfiguration>(initialConfig);
  const [activeTab, setActiveTab] = useState<"club" | "attendance" | "points" | "semester" | "operations" | "admin">("club");
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Record<string, string>>({
    "club.name": initialConfig.clubName,
    "club.college": initialConfig.collegeName,
    "club.academic_year": initialConfig.academicYearDisplay,
    "club.timezone": initialConfig.defaultTimezone,
    "club.currency": initialConfig.defaultCurrency,
    "club.description": initialConfig.clubDescription,

    "attendance.session_duration": String(initialConfig.defaultSessionDuration),
    "attendance.late_threshold": String(initialConfig.defaultLateThreshold),
    "attendance.points": String(initialConfig.defaultAttendancePoints),
    "attendance.late_points": String(initialConfig.defaultLateAttendancePoints),
    "attendance.pin_expiry": String(initialConfig.defaultVolunteerPinExpiry),

    "points.task_default": String(initialConfig.defaultTaskPoints),
    "points.attendance_reward": String(initialConfig.defaultAttendanceReward),
    "points.event_reward": String(initialConfig.defaultEventReward),
    "points.volunteer_reward": String(initialConfig.defaultVolunteerReward),
    "points.manual_award": String(initialConfig.defaultManualAward),
    "points.penalty": String(initialConfig.defaultPenalty),

    "semester.length_days": String(initialConfig.defaultSemesterLength),
    "semester.naming_pattern": initialConfig.defaultSemesterNamingPattern,
    "semester.grace_period_days": String(initialConfig.membershipRenewalGracePeriod),
    "semester.enrollment_status": initialConfig.defaultEnrollmentStatus,

    "operations.event_duration": String(initialConfig.defaultEventDuration),
    "operations.task_status": initialConfig.defaultTaskStatus,
    "operations.event_status": initialConfig.defaultEventStatus,
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateConfigurationAction(formData);
      if (res.success && res.data) {
        setConfig(res.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(res.error?.message || "Failed to update configuration");
      }
    });
  };

  const refreshConfig = async () => {
    startTransition(async () => {
      const res = await getConfigurationAction();
      if (res.success && res.data) {
        setConfig(res.data);
      }
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            System Administration & Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Centralized platform configuration, governance defaults, and system administration workspace
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={refreshConfig} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
            <Save className="h-4 w-4" />
            <span>{isPending ? "Saving..." : "Save Settings"}</span>
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3 text-xs text-emerald-400 font-semibold shadow-sm flex items-center justify-between">
          <span>Configuration saved successfully! All operational modules now inherit these global settings.</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-border text-sm font-semibold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("club")}
          className={`pb-2 px-3 flex items-center space-x-2 shrink-0 ${
            activeTab === "club" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Club Configuration</span>
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`pb-2 px-3 flex items-center space-x-2 shrink-0 ${
            activeTab === "attendance" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Attendance Defaults</span>
        </button>

        <button
          onClick={() => setActiveTab("points")}
          className={`pb-2 px-3 flex items-center space-x-2 shrink-0 ${
            activeTab === "points" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Points Defaults</span>
        </button>

        <button
          onClick={() => setActiveTab("semester")}
          className={`pb-2 px-3 flex items-center space-x-2 shrink-0 ${
            activeTab === "semester" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Semester Defaults</span>
        </button>

        <button
          onClick={() => setActiveTab("operations")}
          className={`pb-2 px-3 flex items-center space-x-2 shrink-0 ${
            activeTab === "operations" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Operations Defaults</span>
        </button>

        <button
          onClick={() => setActiveTab("admin")}
          className={`pb-2 px-3 flex items-center space-x-2 shrink-0 ${
            activeTab === "admin" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>System Administration</span>
        </button>
      </div>

      {/* Tab 1: Club Settings */}
      {activeTab === "club" && (
        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
          <h3 className="font-bold text-foreground text-base border-b border-border pb-2">Phase 1 — Club & Institution Profile</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Club Name</label>
              <input
                type="text"
                value={formData["club.name"] || ""}
                onChange={(e) => handleChange("club.name", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">College / Institution</label>
              <input
                type="text"
                value={formData["club.college"] || ""}
                onChange={(e) => handleChange("club.college", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Academic Year Display</label>
              <input
                type="text"
                value={formData["club.academic_year"] || ""}
                onChange={(e) => handleChange("club.academic_year", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Timezone</label>
              <input
                type="text"
                value={formData["club.timezone"] || ""}
                onChange={(e) => handleChange("club.timezone", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Currency</label>
              <input
                type="text"
                value={formData["club.currency"] || ""}
                onChange={(e) => handleChange("club.currency", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Description</label>
              <input
                type="text"
                value={formData["club.description"] || ""}
                onChange={(e) => handleChange("club.description", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isPending} className="bg-blue-600 text-white">Save Club Settings</Button>
          </div>
        </form>
      )}

      {/* Tab 2: Attendance Defaults */}
      {activeTab === "attendance" && (
        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
          <h3 className="font-bold text-foreground text-base border-b border-border pb-2">Phase 2 — Attendance Module Defaults</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Session Duration (Minutes)</label>
              <input
                type="number"
                value={formData["attendance.session_duration"] || "60"}
                onChange={(e) => handleChange("attendance.session_duration", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Late Threshold (Minutes)</label>
              <input
                type="number"
                value={formData["attendance.late_threshold"] || "15"}
                onChange={(e) => handleChange("attendance.late_threshold", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Attendance Points (On-Time)</label>
              <input
                type="number"
                value={formData["attendance.points"] || "15"}
                onChange={(e) => handleChange("attendance.points", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Late Attendance Points</label>
              <input
                type="number"
                value={formData["attendance.late_points"] || "5"}
                onChange={(e) => handleChange("attendance.late_points", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Volunteer PIN Expiry (Minutes)</label>
              <input
                type="number"
                value={formData["attendance.pin_expiry"] || "120"}
                onChange={(e) => handleChange("attendance.pin_expiry", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isPending} className="bg-blue-600 text-white">Save Attendance Settings</Button>
          </div>
        </form>
      )}

      {/* Tab 3: Points Settings */}
      {activeTab === "points" && (
        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
          <h3 className="font-bold text-foreground text-base border-b border-border pb-2">Phase 3 — Points Engine Defaults</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Task Completion Points</label>
              <input
                type="number"
                value={formData["points.task_default"] || "10"}
                onChange={(e) => handleChange("points.task_default", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Event Participation Reward Points</label>
              <input
                type="number"
                value={formData["points.event_reward"] || "20"}
                onChange={(e) => handleChange("points.event_reward", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Volunteer Session Reward Points</label>
              <input
                type="number"
                value={formData["points.volunteer_reward"] || "25"}
                onChange={(e) => handleChange("points.volunteer_reward", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Manual Award Default Points</label>
              <input
                type="number"
                value={formData["points.manual_award"] || "25"}
                onChange={(e) => handleChange("points.manual_award", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Penalty Points</label>
              <input
                type="number"
                value={formData["points.penalty"] || "10"}
                onChange={(e) => handleChange("points.penalty", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isPending} className="bg-blue-600 text-white">Save Points Settings</Button>
          </div>
        </form>
      )}

      {/* Tab 4: Semester Defaults */}
      {activeTab === "semester" && (
        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
          <h3 className="font-bold text-foreground text-base border-b border-border pb-2">Phase 4 — Semester Management Defaults</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Semester Length (Days)</label>
              <input
                type="number"
                value={formData["semester.length_days"] || "180"}
                onChange={(e) => handleChange("semester.length_days", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Naming Pattern</label>
              <input
                type="text"
                value={formData["semester.naming_pattern"] || "Spring {year}"}
                onChange={(e) => handleChange("semester.naming_pattern", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Membership Renewal Grace Period (Days)</label>
              <input
                type="number"
                value={formData["semester.grace_period_days"] || "14"}
                onChange={(e) => handleChange("semester.grace_period_days", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Enrollment Status</label>
              <input
                type="text"
                value={formData["semester.enrollment_status"] || "active"}
                onChange={(e) => handleChange("semester.enrollment_status", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isPending} className="bg-blue-600 text-white">Save Semester Settings</Button>
          </div>
        </form>
      )}

      {/* Tab 5: Operations Defaults */}
      {activeTab === "operations" && (
        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-3xl">
          <h3 className="font-bold text-foreground text-base border-b border-border pb-2">Phase 5 — Operations & Events Defaults</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Event Duration (Minutes)</label>
              <input
                type="number"
                value={formData["operations.event_duration"] || "180"}
                onChange={(e) => handleChange("operations.event_duration", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Task Status</label>
              <input
                type="text"
                value={formData["operations.task_status"] || "active"}
                onChange={(e) => handleChange("operations.task_status", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Default Event Status</label>
              <input
                type="text"
                value={formData["operations.event_status"] || "published"}
                onChange={(e) => handleChange("operations.event_status", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isPending} className="bg-blue-600 text-white">Save Operations Settings</Button>
          </div>
        </form>
      )}

      {/* Tab 6: System Administration & Governance */}
      {activeTab === "admin" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* RBAC Governance Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 border-b border-border pb-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">RBAC Role Permissions</h3>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between items-center p-2 rounded-lg bg-background border border-border">
                <span className="font-semibold text-foreground">Super Admin</span>
                <Badge variant="success">All Permissions Granted</Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-background border border-border">
                <span className="font-semibold text-foreground">Faculty Advisor</span>
                <Badge variant="info">View & Approval Gate</Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-background border border-border">
                <span className="font-semibold text-foreground">Member / Volunteer</span>
                <Badge variant="secondary">Limited Access</Badge>
              </div>
            </div>
          </div>

          {/* Infrastructure Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 border-b border-border pb-3">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Database & Infrastructure</h3>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Database Engine:</span>
                <span className="font-mono text-foreground">PostgreSQL / Supabase</span>
              </div>
              <div className="flex justify-between items-center">
                <span>ORM Framework:</span>
                <span className="font-mono text-foreground">Drizzle ORM v0.30</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Configuration Service:</span>
                <span className="font-mono text-emerald-500">ConfigurationService (Active)</span>
              </div>
            </div>
          </div>

          {/* Phase 6 Placeholder 1: Backup & Restore */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-3 border-b border-border pb-3">
              <HardDrive className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-foreground">Backup & Recovery</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Automated database snapshots and manual dump restore workspace.
            </p>
            <Badge variant="outline" className="text-[10px]">Placeholder - Ready for Administration Phase</Badge>
          </div>

          {/* Phase 6 Placeholder 2: Audit Logs */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-3 border-b border-border pb-3">
              <FileText className="h-5 w-5 text-amber-400" />
              <h3 className="font-semibold text-foreground">Audit Log Viewer</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Security audit log streaming for points awards, semester activations, and user modifications.
            </p>
            <Badge variant="outline" className="text-[10px]">Placeholder - Ready for Governance Phase</Badge>
          </div>

          {/* Phase 6 Placeholder 3: System Health */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3 md:col-span-2">
            <div className="flex items-center space-x-3 border-b border-border pb-3">
              <Activity className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-foreground">System Health Status</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-background flex justify-between items-center">
                <span>Database Connection</span>
                <span className="font-bold text-emerald-400">Operational</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-background flex justify-between items-center">
                <span>Active Semester Engine</span>
                <span className="font-bold text-emerald-400">Healthy</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-background flex justify-between items-center">
                <span>Volunteer Auth Service</span>
                <span className="font-bold text-emerald-400">Online</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
