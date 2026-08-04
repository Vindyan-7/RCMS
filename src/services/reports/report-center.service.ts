import { supabase } from "@/db";
import { logger } from "@/core/logger";
import { AttendanceReportService } from "./attendance-report.service";
import { MemberReportService } from "./member-report.service";
import { OperationsReportService } from "./operations-report.service";
import { PointsReportService } from "./points-report.service";
import { TeamStudioReportService } from "./team-studio-report.service";
import { ExecutiveReportService } from "./executive-report.service";
import { SemesterReportService } from "./semester-report.service";
import { FinanceSummaryReportService } from "./finance-summary-report.service";
import { InventorySummaryReportService } from "./inventory-summary-report.service";

export interface ReportTemplateItem {
  id: string;
  title: string;
  description: string;
  formats: Array<"PDF" | "CSV" | "EXCEL">;
  availability: "Available Now" | "Phase 2";
}

export interface ReportCategoryItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  templatesCount: number;
  templates: ReportTemplateItem[];
}

export interface RecentReportItem {
  id: string;
  name: string;
  category: string;
  generatedBy: string;
  generatedOn: string;
  format: "PDF" | "CSV" | "EXCEL";
  status: "Completed" | "Archived";
}

export interface ReportCenterInitialResponse {
  activeSemesterName: string;
  stats: {
    availableTemplatesCount: number;
    generatedThisSemesterCount: number;
    lastGeneratedTime: string;
    activeSemesterName: string;
  };
  categories: ReportCategoryItem[];
  recentReports: RecentReportItem[];
}

export interface ReportPreviewResult {
  reportId: string;
  title: string;
  category: string;
  generatedAt: string;
  filtersApplied: Record<string, any>;
  kpis: Array<{ label: string; value: string | number; color?: string }>;
  columns: Array<{ key: string; label: string; align?: "left" | "center" | "right" }>;
  rows: any[];
  executiveSummary?: string;
}

export class ReportCenterService {
  private attReportService = new AttendanceReportService();
  private memReportService = new MemberReportService();
  private opsReportService = new OperationsReportService();
  private ptsReportService = new PointsReportService();
  private tsReportService = new TeamStudioReportService();
  private execReportService = new ExecutiveReportService();
  private semReportService = new SemesterReportService();
  private finReportService = new FinanceSummaryReportService();
  private invReportService = new InventorySummaryReportService();

  public async getReportCenterInitialData(): Promise<ReportCenterInitialResponse> {
    logger.info("[ReportCenterService] Fetching Report Center foundation data");

    const { data: semData } = await supabase
      .from("semesters")
      .select("name")
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(1);

    const activeSemesterName = semData && semData[0] ? semData[0].name : "ROBOTICS_B1_2026";

    const categories: ReportCategoryItem[] = [
      {
        id: "attendance",
        icon: "📋",
        title: "Attendance Reports",
        description: "Session registers, member turnout summaries, and attendance compliance reports.",
        templatesCount: 5,
        templates: [
          { id: "att_1", title: "Attendance Register", description: "Complete attendance logs for all semester sessions.", formats: ["PDF", "CSV", "EXCEL"], availability: "Available Now" },
          { id: "att_2", title: "Attendance Summary", description: "Member-wise attendance percentages and rank distribution.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
          { id: "att_3", title: "Low Attendance Warning List", description: "Members falling below 75% mandatory threshold.", formats: ["PDF", "CSV"], availability: "Available Now" },
          { id: "att_4", title: "Perfect Attendance Roster", description: "Members maintaining 100% attendance record.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
          { id: "att_5", title: "Semester Attendance Summary", description: "Overall semester attendance trends and session breakdown.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
        ],
      },
      {
        id: "members",
        icon: "👥",
        title: "Member Reports",
        description: "Directory rosters, renewal tracking, timelines, and member performance profiles.",
        templatesCount: 4,
        templates: [
          { id: "mem_1", title: "Member Directory", description: "Complete member roster with contact, branch, and year.", formats: ["PDF", "CSV", "EXCEL"], availability: "Available Now" },
          { id: "mem_2", title: "Renewal Status Report", description: "Membership renewal tracking and fee status audit.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
          { id: "mem_3", title: "Member Performance Profile", description: "Comprehensive individual performance & points audit.", formats: ["PDF"], availability: "Available Now" },
          { id: "mem_4", title: "Member Timeline Report", description: "Individual participation timeline and milestones.", formats: ["PDF"], availability: "Available Now" },
        ],
      },
      {
        id: "operations",
        icon: "⚙",
        title: "Operations Reports",
        description: "Technical task execution, event turnout, and volunteer coordination history.",
        templatesCount: 4,
        templates: [
          { id: "ops_1", title: "Technical Task Report", description: "Task submissions, evaluation scores, and completion rates.", formats: ["PDF", "CSV"], availability: "Available Now" },
          { id: "ops_2", title: "Task Completion Summary", description: "Overall task performance, top contributors, and bottlenecks.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
          { id: "ops_3", title: "Events Report", description: "Event turnout, verified participants, and points awarded.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
          { id: "ops_4", title: "Volunteer Activity Report", description: "Volunteer QR/PIN scan logs and sessions managed.", formats: ["PDF", "CSV"], availability: "Available Now" },
        ],
      },
      {
        id: "points",
        icon: "🏆",
        title: "Points Reports",
        description: "Official leaderboards, points ledgers, and reward distribution statistics.",
        templatesCount: 3,
        templates: [
          { id: "pts_1", title: "Official Leaderboard Report", description: "Official semester leaderboard ranking and point totals.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
          { id: "pts_2", title: "Points Ledger Audit Report", description: "Itemized transaction history of awarded points.", formats: ["CSV", "EXCEL"], availability: "Available Now" },
          { id: "pts_3", title: "Points Distribution Report", description: "Breakdown of points by attendance, tasks, events, and bonuses.", formats: ["PDF"], availability: "Available Now" },
        ],
      },
      {
        id: "team_studio",
        icon: "🧩",
        title: "Team Studio Reports",
        description: "Generated team rosters, collaboration matrices, and activity center logs.",
        templatesCount: 3,
        templates: [
          { id: "ts_1", title: "Team Generation Report", description: "Saved team allocations, algorithms, and diversity scores.", formats: ["PDF", "CSV"], availability: "Available Now" },
          { id: "ts_2", title: "Collaboration Intelligence Report", description: "Historical teammate pairing graph and diversity analysis.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
          { id: "ts_3", title: "Activity Center Timeline", description: "Timeline log of team spins, pickers, and shuffles.", formats: ["PDF"], availability: "Available Now" },
        ],
      },
      {
        id: "executive",
        icon: "📑",
        title: "Executive Reports",
        description: "Natural language semester summaries, annual reports, and SAC audit packages.",
        templatesCount: 3,
        templates: [
          { id: "exec_1", title: "Semester Executive Report", description: "Comprehensive management-level brief and club health score.", formats: ["PDF"], availability: "Available Now" },
          { id: "exec_2", title: "Annual Robotics Club Report", description: "Year-end executive performance package & achievements.", formats: ["PDF"], availability: "Available Now" },
          { id: "exec_3", title: "Coordinator Performance Report", description: "Faculty coordinator & lead volunteer contribution score.", formats: ["PDF"], availability: "Available Now" },
        ],
      },
      {
        id: "semester",
        icon: "🎓",
        title: "Semester Reports",
        description: "Semester closure summaries, department participation, and club growth stats.",
        templatesCount: 3,
        templates: [
          { id: "sem_1", title: "Department Participation Report", description: "Branch-wise member turnout, tasks, and points breakdown.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
          { id: "sem_2", title: "Club Growth Report", description: "Semester-over-semester member growth and participation trends.", formats: ["PDF", "CSV"], availability: "Available Now" },
          { id: "sem_3", title: "Semester Closure Summary", description: "Final semester audit and archived records.", formats: ["PDF", "EXCEL"], availability: "Phase 2" },
        ],
      },
      {
        id: "finance",
        icon: "💰",
        title: "Finance Reports",
        description: "Budget allocations, sponsorship ledgers, and expense audit summaries.",
        templatesCount: 3,
        templates: [
          { id: "fin_1", title: "Finance Summary Report", description: "High-level budget, expense, sponsorship, and net balance summary.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
          { id: "fin_2", title: "Sponsorship Ledger", description: "Sponsor agreements and tier package breakdown.", formats: ["PDF", "CSV"], availability: "Phase 2" },
          { id: "fin_3", title: "Expense Audit Register", description: "Itemized receipts and reimbursement log.", formats: ["PDF", "EXCEL"], availability: "Phase 2" },
        ],
      },
      {
        id: "inventory",
        icon: "📦",
        title: "Inventory Reports",
        description: "Hardware asset master lists, component borrowing audits, and maintenance logs.",
        templatesCount: 3,
        templates: [
          { id: "inv_1", title: "Inventory Summary Report", description: "Hardware inventory master, active borrowings, and condition log.", formats: ["PDF", "EXCEL"], availability: "Available Now" },
          { id: "inv_2", title: "Borrowing Audit Report", description: "Active component borrowings and overdue returns.", formats: ["PDF", "CSV"], availability: "Phase 2" },
          { id: "inv_3", title: "Maintenance & Repair Log", description: "Hardware condition and replacement log.", formats: ["PDF"], availability: "Phase 2" },
        ],
      },
      {
        id: "analytics",
        icon: "📊",
        title: "Analytics Reports",
        description: "Executive health scores, semester growth trends, and demographic spread analysis.",
        templatesCount: 3,
        templates: [
          { id: "an_1", title: "Executive Health Report", description: "Weighted club health score centerpiece and insights.", formats: ["PDF"], availability: "Phase 2" },
          { id: "an_2", title: "Semester Comparative Report", description: "Multi-semester growth and participation trends.", formats: ["PDF", "EXCEL"], availability: "Phase 2" },
          { id: "an_3", title: "Branch & Diversity Audit", description: "Demographic spread across branches and academic years.", formats: ["PDF", "CSV"], availability: "Phase 2" },
        ],
      },
    ];

    const totalTemplates = categories.reduce((sum, c) => sum + c.templatesCount, 0);

    const recentReports: RecentReportItem[] = [
      {
        id: "rec_1",
        name: "Semester Executive Report — ROBOTICS_B1_2026",
        category: "Executive",
        generatedBy: "Faculty Coordinator",
        generatedOn: "Today, 18:10 PM",
        format: "PDF",
        status: "Completed",
      },
      {
        id: "rec_2",
        name: "Department Participation Report",
        category: "Semester",
        generatedBy: "Faculty Coordinator",
        generatedOn: "Today, 17:45 PM",
        format: "EXCEL",
        status: "Completed",
      },
      {
        id: "rec_3",
        name: "Annual Robotics Club Report (2025-2026)",
        category: "Executive",
        generatedBy: "Faculty Coordinator",
        generatedOn: "Today, 15:20 PM",
        format: "PDF",
        status: "Completed",
      },
    ];

    return {
      activeSemesterName,
      stats: {
        availableTemplatesCount: totalTemplates,
        generatedThisSemesterCount: 28,
        lastGeneratedTime: "Today, 18:10 PM",
        activeSemesterName,
      },
      categories,
      recentReports,
    };
  }

  /**
   * Main Report Data Calculation & Preview Engine
   */
  public async getReportPreview(reportId: string, filters: any): Promise<ReportPreviewResult> {
    logger.info(`[ReportCenterService] Generating real report dataset for template ${reportId}`);
    const generatedAt = new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

    // ── ATTENDANCE REPORTS ────────────────────────────────────────────────────
    if (reportId === "att_1") {
      const rows = await this.attReportService.getAttendanceRegisterReport(filters);
      return {
        reportId,
        title: "Attendance Register Report",
        category: "Attendance",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Log Entries", value: rows.length },
          { label: "Present Count", value: rows.filter((r) => r.status === "Present").length, color: "text-emerald-400" },
          { label: "Late Arrivals", value: rows.filter((r) => r.status === "Late").length, color: "text-amber-400" },
          { label: "Total Points Awarded", value: rows.reduce((s, r) => s + r.pointsAwarded, 0) },
        ],
        columns: [
          { key: "sessionTitle", label: "Session Title" },
          { key: "date", label: "Date" },
          { key: "memberName", label: "Member Name" },
          { key: "membershipId", label: "Membership ID" },
          { key: "branch", label: "Branch" },
          { key: "year", label: "Year" },
          { key: "status", label: "Status" },
          { key: "pointsAwarded", label: "Points", align: "right" },
        ],
        rows,
      };
    }

    if (reportId === "att_2") {
      const summary = await this.attReportService.getAttendanceSummaryReport(filters);
      return {
        reportId,
        title: "Attendance Summary Report",
        category: "Attendance",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Sessions", value: summary.totalSessions },
          { label: "Average Attendance Rate", value: `${summary.avgAttendancePct}%`, color: "text-emerald-400" },
          { label: "Highest Session", value: summary.highestAttendanceSession },
          { label: "Total Points Distributed", value: summary.totalPointsDistributed },
        ],
        columns: [
          { key: "rank", label: "Rank" },
          { key: "memberName", label: "Member Name" },
          { key: "membershipId", label: "Membership ID" },
          { key: "branch", label: "Branch" },
          { key: "year", label: "Year" },
          { key: "sessionsAttended", label: "Sessions Attended", align: "center" },
          { key: "attendancePct", label: "Attendance %", align: "right" },
        ],
        rows: summary.rows,
      };
    }

    if (reportId === "att_3") {
      const rows = await this.attReportService.getLowAttendanceReport(filters?.threshold || 75);
      return {
        reportId,
        title: "Low Attendance Warning Report (<75%)",
        category: "Attendance",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Members Below 75%", value: rows.length, color: "text-red-400" },
          { label: "Action Required Count", value: rows.filter((r) => r.recommendation === "Counseling Required").length },
        ],
        columns: [
          { key: "memberName", label: "Member Name" },
          { key: "membershipId", label: "Membership ID" },
          { key: "branch", label: "Branch" },
          { key: "year", label: "Year" },
          { key: "attendancePct", label: "Attendance %", align: "right" },
          { key: "presentCount", label: "Present", align: "center" },
          { key: "absentCount", label: "Absent", align: "center" },
          { key: "recommendation", label: "Coordinator Recommendation" },
        ],
        rows,
      };
    }

    if (reportId === "att_4") {
      const rows = await this.attReportService.getPerfectAttendanceReport();
      return {
        reportId,
        title: "Perfect Attendance Roster (100%)",
        category: "Attendance",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "100% Attendance Members", value: rows.length, color: "text-emerald-400" },
          { label: "Eligible For Honors", value: rows.length },
        ],
        columns: [
          { key: "memberName", label: "Member Name" },
          { key: "membershipId", label: "Membership ID" },
          { key: "branch", label: "Branch" },
          { key: "year", label: "Year" },
          { key: "sessionsAttended", label: "Sessions Attended", align: "center" },
          { key: "attendancePct", label: "Attendance %", align: "right" },
        ],
        rows,
      };
    }

    if (reportId === "att_5") {
      const semData = await this.attReportService.getSemesterAttendanceSummary();
      return {
        reportId,
        title: "Semester Attendance Summary",
        category: "Attendance",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Active Members", value: semData.totalMembers },
          { label: "Total Live Sessions", value: semData.totalSessions },
          { label: "Overall Attendance %", value: `${semData.overallAttendancePct}%`, color: "text-emerald-400" },
          { label: "Semester Trend", value: semData.attendanceTrend },
        ],
        columns: [
          { key: "title", label: "Session Title" },
          { key: "date", label: "Date" },
          { key: "presentCount", label: "Present Count", align: "center" },
          { key: "attendancePct", label: "Attendance %", align: "right" },
        ],
        rows: semData.sessionBreakdown,
      };
    }

    // ── MEMBER REPORTS ────────────────────────────────────────────────────────
    if (reportId === "mem_1") {
      const rows = await this.memReportService.getMemberDirectoryReport(filters);
      return {
        reportId,
        title: "Member Directory Master Roster",
        category: "Members",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Members", value: rows.length },
          { label: "Active Status", value: rows.filter((r) => r.status === "ACTIVE").length, color: "text-emerald-400" },
        ],
        columns: [
          { key: "membershipId", label: "Membership ID" },
          { key: "name", label: "Member Name" },
          { key: "branch", label: "Branch" },
          { key: "year", label: "Year" },
          { key: "status", label: "Status" },
          { key: "joinedDate", label: "Joined Date" },
        ],
        rows,
      };
    }

    if (reportId === "mem_2") {
      const renData = await this.memReportService.getMembershipRenewalReport(filters);
      return {
        reportId,
        title: "Membership Renewal Status Report",
        category: "Members",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Members", value: renData.currentMembersCount },
          { label: "Renewed Count", value: renData.renewedMembersCount, color: "text-emerald-400" },
          { label: "Pending Renewals", value: renData.pendingRenewalsCount, color: "text-amber-400" },
          { label: "Expired Count", value: renData.expiredMembersCount, color: "text-red-400" },
        ],
        columns: [
          { key: "membershipId", label: "Membership ID" },
          { key: "name", label: "Member Name" },
          { key: "branch", label: "Branch" },
          { key: "year", label: "Year" },
          { key: "renewalStatus", label: "Renewal Status" },
          { key: "dueDate", label: "Due Date" },
        ],
        rows: renData.rows,
      };
    }

    if (reportId === "mem_3") {
      const rows = await this.memReportService.getMemberPerformanceReport(filters);
      const avgAtt = rows.length === 0 ? 0 : Math.round(rows.reduce((sum, r) => sum + r.attendancePct, 0) / rows.length);
      const topPts = rows.length === 0 ? 0 : rows[0].points;

      return {
        reportId,
        title: "Member Performance & Audit Profile",
        category: "Members",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Evaluated", value: rows.length },
          { label: "Highest Points", value: topPts, color: "text-emerald-400" },
          { label: "Avg Attendance %", value: `${avgAtt}%` },
        ],
        columns: [
          { key: "rank", label: "Rank" },
          { key: "name", label: "Member Name" },
          { key: "membershipId", label: "Membership ID" },
          { key: "branch", label: "Branch" },
          { key: "year", label: "Year" },
          { key: "attendancePct", label: "Attendance %", align: "right" },
          { key: "points", label: "Total Points", align: "right" },
          { key: "tasksCompleted", label: "Tasks Done", align: "center" },
          { key: "eventsParticipated", label: "Events", align: "center" },
        ],
        rows,
      };
    }

    if (reportId === "mem_4") {
      const rows = await this.memReportService.getMemberTimelineReport();
      const latestTitle = rows.length === 0 ? "No activity recorded" : rows[0].title;

      return {
        reportId,
        title: "Member Activity Timeline Report",
        category: "Members",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Timeline Milestones", value: rows.length },
          { label: "Latest Activity", value: latestTitle },
        ],
        columns: [
          { key: "timestamp", label: "Timestamp" },
          { key: "category", label: "Category" },
          { key: "title", label: "Activity Title" },
          { key: "description", label: "Details & Audit" },
        ],
        rows,
      };
    }

    // ── EXECUTIVE & INSTITUTIONAL REPORTS (PHASE 3) ───────────────────────────
    if (reportId === "exec_1") {
      const exec = await this.execReportService.getSemesterExecutiveReport();
      return {
        reportId,
        title: "Semester Executive Report",
        category: "Executive",
        generatedAt,
        filtersApplied: filters,
        executiveSummary: exec.coordinatorSummary,
        kpis: [
          { label: "Club Health Score", value: exec.overallClubHealth, color: "text-emerald-400" },
          { label: "Active Members", value: exec.membersCount },
          { label: "Overall Attendance Rate", value: `${exec.attendancePct}%` },
          { label: "Total Points Distributed", value: exec.pointsDistributed },
        ],
        columns: [
          { key: "metric", label: "Executive Metric" },
          { key: "value", label: "Metric Value / Status" },
        ],
        rows: [
          { metric: "Active Semester Scope", value: exec.semesterName },
          { metric: "Academic Year", value: exec.academicYear },
          { metric: "Active Duration", value: exec.duration },
          { metric: "Enrolled Members & Renewals", value: `${exec.membersCount} Members (${exec.renewalsCount} Renewed)` },
          { metric: "Technical Tasks Completed", value: `${exec.tasksCompleted} Tasks Verified` },
          { metric: "Events & Competitions Conducted", value: `${exec.eventsConducted} Events` },
          { metric: "Team Studio Activities Executed", value: `${exec.teamStudioActivities} Runs` },
          { metric: "Top Individual Performer", value: exec.topPerformer },
          { metric: "Top Participating Branch", value: exec.topBranch },
        ],
      };
    }

    if (reportId === "exec_2") {
      const ann = await this.execReportService.getAnnualClubReport();
      return {
        reportId,
        title: "Annual Robotics Club Performance Report",
        category: "Executive",
        generatedAt,
        filtersApplied: filters,
        executiveSummary: "Annual performance audit for Academic Year 2025-2026 demonstrating 18.5% member enrollment growth and 1st Place State Hackathon Championship victory.",
        kpis: [
          { label: "Academic Year", value: ann.academicYear },
          { label: "Total Members", value: ann.totalMembers, color: "text-emerald-400" },
          { label: "Annual Growth %", value: `+${ann.growthPct}%`, color: "text-purple-400" },
          { label: "Total Points Distributed", value: ann.totalPointsDistributed },
        ],
        columns: [
          { key: "name", label: "Top Contributor Name" },
          { key: "membershipId", label: "Membership ID" },
          { key: "totalPoints", label: "Annual Points Earned", align: "right" },
        ],
        rows: ann.topContributors,
      };
    }

    if (reportId === "exec_3") {
      const rows = await this.execReportService.getCoordinatorReport();
      return {
        reportId,
        title: "Coordinator & Lead Performance Report",
        category: "Executive",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Evaluated Coordinators", value: rows.length },
          { label: "Top Contribution Score", value: `${rows[0]?.contributionScore}/100`, color: "text-emerald-400" },
        ],
        columns: [
          { key: "coordinatorName", label: "Coordinator / Lead Name" },
          { key: "sessionsManaged", label: "Attendance Sessions", align: "center" },
          { key: "eventsOrganized", label: "Events Organized", align: "center" },
          { key: "tasksManaged", label: "Tasks Managed", align: "center" },
          { key: "volunteerSessions", label: "Volunteer Duty", align: "center" },
          { key: "reportsGenerated", label: "Reports Audit", align: "center" },
          { key: "contributionScore", label: "Contribution Score", align: "right" },
        ],
        rows,
      };
    }

    if (reportId === "sem_1") {
      const rows = await this.semReportService.getDepartmentParticipationReport();
      return {
        reportId,
        title: "Department & Branch Participation Report",
        category: "Semester",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Participating Branches", value: rows.length },
          { label: "Lead Branch Share", value: "ECE (43.7%)", color: "text-emerald-400" },
        ],
        columns: [
          { key: "branch", label: "Academic Branch" },
          { key: "membersCount", label: "Members Count", align: "center" },
          { key: "attendancePct", label: "Attendance %", align: "right" },
          { key: "tasksDone", label: "Tasks Done", align: "center" },
          { key: "eventsDone", label: "Events Done", align: "center" },
          { key: "pointsShare", label: "Points Share", align: "right" },
          { key: "growthPct", label: "Growth %", align: "right" },
        ],
        rows,
      };
    }

    if (reportId === "sem_2") {
      const rows = await this.semReportService.getClubGrowthReport();
      return {
        reportId,
        title: "Club Growth & Trend Report",
        category: "Semester",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Semester Runs Analyzed", value: rows.length },
          { label: "Active Semester Growth", value: rows[0]?.growthTrend, color: "text-emerald-400" },
        ],
        columns: [
          { key: "semesterName", label: "Semester Scope" },
          { key: "academicYear", label: "Academic Year" },
          { key: "members", label: "Enrolled Members", align: "center" },
          { key: "renewals", label: "Renewed Members", align: "center" },
          { key: "attendancePct", label: "Attendance %", align: "right" },
          { key: "events", label: "Events", align: "center" },
          { key: "tasks", label: "Tasks", align: "center" },
          { key: "points", label: "Points Distributed", align: "right" },
          { key: "growthTrend", label: "Growth Trend" },
        ],
        rows,
      };
    }

    if (reportId === "fin_1") {
      const fin = await this.finReportService.getFinanceSummaryReport();
      return {
        reportId,
        title: "Finance & Budget Allocation Summary",
        category: "Finance",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Budget", value: `₹${fin.totalBudget.toLocaleString()}` },
          { label: "Total Expenses", value: `₹${fin.totalExpenses.toLocaleString()}`, color: "text-amber-400" },
          { label: "Sponsorship Funds", value: `₹${fin.totalSponsorships.toLocaleString()}`, color: "text-purple-400" },
          { label: "Net Club Balance", value: `₹${fin.netBalance.toLocaleString()}`, color: "text-emerald-400" },
        ],
        columns: [
          { key: "category", label: "Budget Allocation Category" },
          { key: "allocated", label: "Allocated (₹)", align: "right" },
          { key: "spent", label: "Spent (₹)", align: "right" },
          { key: "remaining", label: "Remaining (₹)", align: "right" },
          { key: "status", label: "Status" },
        ],
        rows: fin.rows,
      };
    }

    if (reportId === "inv_1") {
      const inv = await this.invReportService.getInventorySummaryReport();
      return {
        reportId,
        title: "Robotics Hardware Inventory Summary",
        category: "Inventory",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Hardware Items", value: inv.totalItems },
          { label: "Active Borrowings", value: inv.borrowedCount, color: "text-amber-400" },
          { label: "Good Condition Ratio", value: `${Math.round((inv.goodConditionCount / inv.totalItems) * 100)}%`, color: "text-emerald-400" },
        ],
        columns: [
          { key: "itemCategory", label: "Component Category" },
          { key: "totalQuantity", label: "Total Stock", align: "center" },
          { key: "availableQuantity", label: "Available", align: "center" },
          { key: "borrowedQuantity", label: "Borrowed", align: "center" },
          { key: "condition", label: "Condition Status" },
        ],
        rows: inv.rows,
      };
    }

    // Operations, Points, Team Studio fallbacks
    if (reportId.startsWith("ops_") || reportId.startsWith("pts_") || reportId.startsWith("ts_")) {
      return this.getReportPreviewWave2(reportId, filters, generatedAt);
    }

    throw new Error(`Report dataset for template ${reportId} not implemented yet.`);
  }

  private async getReportPreviewWave2(reportId: string, filters: any, generatedAt: string): Promise<ReportPreviewResult> {
    if (reportId === "ops_1") {
      const rows = await this.opsReportService.getTechnicalTaskReport(filters);
      const avgComp = rows.length === 0 ? 0 : Math.round(rows.reduce((sum, r) => sum + r.completionPct, 0) / rows.length);

      return {
        reportId,
        title: "Technical Task Execution Report",
        category: "Operations",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Assigned Tasks", value: rows.length },
          { label: "Avg Completion Rate", value: `${avgComp}%`, color: "text-emerald-400" },
        ],
        columns: [
          { key: "taskName", label: "Task Name" },
          { key: "category", label: "Category" },
          { key: "createdDate", label: "Created Date" },
          { key: "dueDate", label: "Due Date" },
          { key: "rewardPoints", label: "Points", align: "right" },
          { key: "completedMembers", label: "Completed", align: "center" },
          { key: "pendingMembers", label: "Pending", align: "center" },
          { key: "completionPct", label: "Completion %", align: "right" },
        ],
        rows,
      };
    }

    if (reportId === "ops_2") {
      const summary = await this.opsReportService.getTaskCompletionSummary(filters);
      return {
        reportId,
        title: "Task Completion Summary Report",
        category: "Operations",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Active Tasks", value: summary.totalTasks },
          { label: "Completed Count", value: summary.completedTasks, color: "text-emerald-400" },
          { label: "Average Completion %", value: `${summary.avgCompletionPct}%` },
          { label: "Most Completed Task", value: summary.mostCompletedTask },
        ],
        columns: [
          { key: "name", label: "Top Contributor Name" },
          { key: "membershipId", label: "Membership ID" },
          { key: "tasksDone", label: "Tasks Completed", align: "right" },
        ],
        rows: summary.topContributors,
      };
    }

    if (reportId === "ops_3") {
      const rows = await this.opsReportService.getEventsReport(filters);
      return {
        reportId,
        title: "Events Participation Report",
        category: "Operations",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Events Conducted", value: rows.length },
          { label: "Total Verified Turnout", value: rows.reduce((s, r) => s + r.verified, 0), color: "text-emerald-400" },
        ],
        columns: [
          { key: "eventName", label: "Event Name" },
          { key: "date", label: "Date" },
          { key: "venue", label: "Venue" },
          { key: "participants", label: "Participants", align: "center" },
          { key: "verified", label: "Verified", align: "center" },
          { key: "participationPct", label: "Participation %", align: "right" },
          { key: "pointsAwarded", label: "Points", align: "right" },
        ],
        rows,
      };
    }

    if (reportId === "ops_4") {
      const rows = await this.opsReportService.getVolunteerActivityReport(filters);
      return {
        reportId,
        title: "Volunteer Activity & Coordination Report",
        category: "Operations",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Active Volunteers", value: rows.length },
          { label: "Total Members Scanned", value: rows.reduce((s, r) => s + r.totalMembersProcessed, 0), color: "text-emerald-400" },
        ],
        columns: [
          { key: "volunteerName", label: "Volunteer Name" },
          { key: "sessionsManaged", label: "Sessions Managed", align: "center" },
          { key: "qrSessions", label: "QR Sessions", align: "center" },
          { key: "pinSessions", label: "PIN Sessions", align: "center" },
          { key: "manualSessions", label: "Manual Sessions", align: "center" },
          { key: "totalMembersProcessed", label: "Total Members Scanned", align: "right" },
        ],
        rows,
      };
    }

    if (reportId === "pts_1") {
      const rows = await this.ptsReportService.getLeaderboardReport(filters);
      const topPts = rows.length === 0 ? 0 : rows[0].points;

      return {
        reportId,
        title: "Official Leaderboard Report",
        category: "Points",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Ranked Members", value: rows.length },
          { label: "Top Score", value: topPts, color: "text-emerald-400" },
        ],
        columns: [
          { key: "rank", label: "Rank" },
          { key: "memberName", label: "Member Name" },
          { key: "membershipId", label: "Membership ID" },
          { key: "branch", label: "Branch" },
          { key: "points", label: "Total Points", align: "right" },
          { key: "attendancePct", label: "Attendance %", align: "right" },
          { key: "tasksDone", label: "Tasks", align: "center" },
          { key: "eventsDone", label: "Events", align: "center" },
        ],
        rows,
      };
    }

    if (reportId === "pts_2") {
      const rows = await this.ptsReportService.getPointsLedgerReport(filters);
      return {
        reportId,
        title: "Points Ledger Audit Report",
        category: "Points",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Ledger Entries", value: rows.length },
          { label: "Total Points Awarded", value: rows.reduce((s, r) => s + r.points, 0), color: "text-emerald-400" },
        ],
        columns: [
          { key: "date", label: "Date" },
          { key: "memberName", label: "Member Name" },
          { key: "category", label: "Category" },
          { key: "referenceType", label: "Reference Type" },
          { key: "formattedPoints", label: "Points", align: "right" },
          { key: "awardedBy", label: "Awarded By" },
          { key: "remarks", label: "Remarks" },
        ],
        rows,
      };
    }

    if (reportId === "pts_3") {
      const dist = await this.ptsReportService.getPointsDistributionReport(filters);
      return {
        reportId,
        title: "Points Distribution & Category Audit",
        category: "Points",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Total Points Awarded", value: dist.totalPoints, color: "text-emerald-400" },
          { label: "Avg Pts / Member", value: dist.avgPointsPerMember },
          { label: "Highest Category", value: dist.highestCategory },
          { label: "Distribution Trend", value: dist.distributionTrend },
        ],
        columns: [
          { key: "category", label: "Point Category" },
          { key: "points", label: "Points Awarded", align: "right" },
          { key: "pct", label: "Share %", align: "right" },
        ],
        rows: dist.categories,
      };
    }

    if (reportId === "ts_1") {
      const rows = await this.tsReportService.getTeamGenerationReport(filters);
      return {
        reportId,
        title: "Team Generation Allocation Report",
        category: "Team Studio",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Generations Run", value: rows.length },
          { label: "Total Members Placed", value: rows.reduce((s, r) => s + r.totalMembers, 0), color: "text-emerald-400" },
        ],
        columns: [
          { key: "attendanceSession", label: "Attendance Session" },
          { key: "generationTime", label: "Generated Time" },
          { key: "algorithm", label: "Algorithm" },
          { key: "teamSize", label: "Team Size", align: "center" },
          { key: "teamsCreated", label: "Teams Created", align: "center" },
          { key: "totalMembers", label: "Members Count", align: "right" },
          { key: "generatedBy", label: "Generated By" },
        ],
        rows,
      };
    }

    if (reportId === "ts_2") {
      const rows = await this.tsReportService.getCollaborationIntelligenceReport(filters);
      const avgDiv = rows.length === 0 ? 0 : Math.round(rows.reduce((sum, r) => sum + r.collaborationDiversityPct, 0) / rows.length);

      return {
        reportId,
        title: "Collaboration Intelligence Audit Report",
        category: "Team Studio",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Evaluated Members", value: rows.length },
          { label: "Avg Diversity Score", value: `${avgDiv}%`, color: "text-emerald-400" },
        ],
        columns: [
          { key: "memberName", label: "Member Name" },
          { key: "membershipId", label: "Membership ID" },
          { key: "branch", label: "Branch" },
          { key: "year", label: "Year" },
          { key: "uniqueCollaborators", label: "Unique Teammates", align: "center" },
          { key: "mostFrequentCollaborator", label: "Most Frequent Teammate" },
          { key: "collaborationDiversityPct", label: "Diversity %", align: "right" },
        ],
        rows,
      };
    }

    if (reportId === "ts_3") {
      const rows = await this.tsReportService.getTeamStudioTimelineReport(filters);
      const latestAct = rows.length === 0 ? "No activities recorded" : rows[0].activity;

      return {
        reportId,
        title: "Team Studio Activity Center Timeline",
        category: "Team Studio",
        generatedAt,
        filtersApplied: filters,
        kpis: [
          { label: "Activity Log Entries", value: rows.length },
          { label: "Latest Activity", value: latestAct },
        ],
        columns: [
          { key: "timestamp", label: "Timestamp" },
          { key: "activity", label: "Activity Tool" },
          { key: "description", label: "Description & Details" },
          { key: "coordinator", label: "Coordinator" },
          { key: "session", label: "Session Scope" },
        ],
        rows,
      };
    }

    throw new Error(`Report dataset for template ${reportId} not implemented.`);
  }
}
