import { supabase } from "@/db";
import { logger } from "@/core/logger";
import { normalizeBranch } from "@/constants/branches";

export interface LeaderboardReportRow {
  rank: number;
  memberName: string;
  membershipId: string;
  branch: string;
  year: number;
  academicYear: string;
  currentSemester: string;
  points: number;
  attendancePoints: number;
  taskPoints: number;
  eventPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  attendancePct: number;
  tasksDone: number;
  eventsDone: number;
}

export interface PointsLedgerRow {
  date: string;
  memberName: string;
  membershipId: string;
  category: string;
  referenceType: string;
  referenceName: string;
  points: number;
  formattedPoints: string;
  awardedBy: string;
  remarks: string;
  transactionStatus: string;
}

export interface PointsDistributionData {
  attendancePoints: number;
  taskPoints: number;
  eventPoints: number;
  volunteerPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  manualAdjustments: number;
  totalPoints: number;
  avgPointsPerMember: number;
  highestCategory: string;
  lowestCategory: string;
  distributionTrend: string;
  categories: Array<{ category: string; points: number; pct: number }>;
}

export class PointsReportService {

  /**
   * 1. Official Leaderboard Report — Live Database Calculation
   */
  public async getLeaderboardReport(filters: any = {}): Promise<LeaderboardReportRow[]> {
    logger.info("[PointsReportService] Calculating Official Leaderboard Report from live database");

    const [memsRes, attSessRes, attRecsRes, ledgerRes, tasksRes, eventsRes] = await Promise.all([
      supabase.from("members").select("id, name, member_id, club_membership_id, branch, year, academic_year").eq("status", "active").is("deleted_at", null),
      supabase.from("attendance_sessions").select("id").is("deleted_at", null),
      supabase.from("attendance_records").select("member_id, points"),
      supabase.from("points_ledger").select("member_id, points, category"),
      supabase.from("task_completions").select("member_id"),
      supabase.from("event_participations").select("member_id"),
    ]);

    const members = memsRes.data || [];
    const totalSessions = (attSessRes.data || []).length;
    const attRecords = attRecsRes.data || [];
    const ledger = ledgerRes.data || [];
    const tasks = tasksRes.data || [];
    const events = eventsRes.data || [];

    if (members.length === 0) {
      return [];
    }

    const attCountMap = new Map<string, number>();
    const taskCountMap = new Map<string, number>();
    const eventCountMap = new Map<string, number>();
    const ptsBreakdownMap = new Map<string, { att: number; task: number; event: number; bonus: number; penalty: number; total: number }>();

    // Attendance Records points & count
    for (const r of attRecords) {
      const c = attCountMap.get(r.member_id) || 0;
      attCountMap.set(r.member_id, c + 1);

      const pts = ptsBreakdownMap.get(r.member_id) || { att: 0, task: 0, event: 0, bonus: 0, penalty: 0, total: 0 };
      const val = r.points || 0;
      if (val < 0) pts.penalty += val;
      else pts.att += val;
      pts.total += val;
      ptsBreakdownMap.set(r.member_id, pts);
    }

    // Ledger Points
    for (const l of ledger) {
      const pts = ptsBreakdownMap.get(l.member_id) || { att: 0, task: 0, event: 0, bonus: 0, penalty: 0, total: 0 };
      const val = l.points || 0;
      const cat = (l.category || "manual").toLowerCase();

      if (val < 0 || cat === "penalty") {
        pts.penalty += val;
      } else if (cat === "attendance") {
        pts.att += val;
      } else if (cat === "task") {
        pts.task += val;
      } else if (cat === "event") {
        pts.event += val;
      } else {
        pts.bonus += val;
      }
      pts.total += val;
      ptsBreakdownMap.set(l.member_id, pts);
    }

    // Task & Event Counts
    for (const t of tasks) {
      const c = taskCountMap.get(t.member_id) || 0;
      taskCountMap.set(t.member_id, c + 1);
    }
    for (const e of events) {
      const c = eventCountMap.get(e.member_id) || 0;
      eventCountMap.set(e.member_id, c + 1);
    }

    // Build Rows
    let rows: LeaderboardReportRow[] = members.map((m: any) => {
      const attended = attCountMap.get(m.id) || 0;
      const attPct = totalSessions === 0 ? 100 : Math.round((attended / totalSessions) * 100);
      const pts = ptsBreakdownMap.get(m.id) || { att: 0, task: 0, event: 0, bonus: 0, penalty: 0, total: 0 };

      return {
        rank: 1,
        memberName: m.name || "Member",
        membershipId: m.club_membership_id || m.member_id || "SAC-RC-0000",
        branch: normalizeBranch(m.branch),
        year: m.year || 1,
        academicYear: m.academic_year || "2025-2026",
        currentSemester: "ROBOTICS_B1_2026",
        points: pts.total,
        attendancePoints: pts.att,
        taskPoints: pts.task,
        eventPoints: pts.event,
        bonusPoints: pts.bonus,
        penaltyPoints: pts.penalty,
        attendancePct: attPct,
        tasksDone: taskCountMap.get(m.id) || 0,
        eventsDone: eventCountMap.get(m.id) || 0,
      };
    });

    // Apply Client Filters (Branch, Year)
    if (filters.branch && filters.branch !== "all") {
      rows = rows.filter((r) => r.branch.toLowerCase() === filters.branch.toLowerCase());
    }
    if (filters.year && filters.year !== "all") {
      rows = rows.filter((r) => String(r.year) === String(filters.year));
    }

    // Dynamic Leaderboard Position Calculation (Sort by Total Points Descending)
    rows.sort((a, b) => b.points - a.points);
    rows.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return rows;
  }

  /**
   * 2. Points Ledger Audit Report — Live Database Query
   */
  public async getPointsLedgerReport(filters: any = {}): Promise<PointsLedgerRow[]> {
    logger.info("[PointsLedgerReportService] Querying Points Ledger Audit Report from live database");

    const { data: ledger, error } = await supabase
      .from("points_ledger")
      .select("id, points, category, reference_type, reference_id, created_at, remarks, created_by, members(name, club_membership_id, member_id, branch, year)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !ledger || ledger.length === 0) {
      return [];
    }

    let rows: PointsLedgerRow[] = ledger.map((l: any) => {
      const mem = Array.isArray(l.members) ? l.members[0] : l.members;
      const dateStr = l.created_at ? new Date(l.created_at).toLocaleDateString([], { dateStyle: "medium" }) : "N/A";
      const ptsVal = l.points || 0;
      const formattedPts = ptsVal >= 0 ? `+${ptsVal}` : `${ptsVal}`;

      return {
        date: dateStr,
        memberName: mem?.name || "Member",
        membershipId: mem?.club_membership_id || mem?.member_id || "SAC-RC-0000",
        category: (l.category || "ATTENDANCE").toUpperCase(),
        referenceType: l.reference_type ? l.reference_type.toUpperCase() : "TRANSACTION",
        referenceName: l.reference_id ? String(l.reference_id).substring(0, 8) : "System Engine",
        points: ptsVal,
        formattedPoints: formattedPts,
        awardedBy: "System Auto-Engine",
        remarks: l.remarks || "Points ledger transaction recorded",
        transactionStatus: "COMPLETED",
      };
    });

    // Apply Client Filters (Branch, Year) if specified
    if (filters.branch && filters.branch !== "all") {
      rows = rows.filter((r) => r.category.toLowerCase().includes(filters.branch.toLowerCase()));
    }

    return rows;
  }

  /**
   * 3. Points Distribution Report — Live Dynamic Calculation
   */
  public async getPointsDistributionReport(filters: any = {}): Promise<PointsDistributionData> {
    logger.info("[PointsReportService] Calculating Points Distribution Report dynamically from live database");

    const [ledgerRes, attRecsRes, memsRes] = await Promise.all([
      supabase.from("points_ledger").select("points, category, created_at"),
      supabase.from("attendance_records").select("points"),
      supabase.from("members").select("id").eq("status", "active").is("deleted_at", null),
    ]);

    const ledger = ledgerRes.data || [];
    const attRecords = attRecsRes.data || [];
    const totalMembersCount = Math.max(1, (memsRes.data || []).length);

    let attPoints = 0;
    let taskPoints = 0;
    let eventPoints = 0;
    let volunteerPoints = 0;
    let bonusPoints = 0;
    let penaltyPoints = 0;
    let manualAdjustments = 0;

    // Sum from Attendance Records
    for (const r of attRecords) {
      const val = r.points || 0;
      if (val < 0) penaltyPoints += val;
      else attPoints += val;
    }

    // Sum from Points Ledger
    for (const l of ledger) {
      const val = l.points || 0;
      const cat = (l.category || "manual").toLowerCase();

      if (val < 0 || cat === "penalty") {
        penaltyPoints += val;
      } else if (cat === "attendance") {
        attPoints += val;
      } else if (cat === "task") {
        taskPoints += val;
      } else if (cat === "event") {
        eventPoints += val;
      } else if (cat === "volunteer") {
        volunteerPoints += val;
      } else if (cat === "manual") {
        manualAdjustments += val;
      } else {
        bonusPoints += val;
      }
    }

    const totalPoints = attPoints + taskPoints + eventPoints + volunteerPoints + bonusPoints + manualAdjustments + penaltyPoints;
    const absTotal = Math.max(1, Math.abs(totalPoints));

    const categories = [
      { category: "Live Attendance", points: attPoints, pct: Math.round((attPoints / absTotal) * 100) },
      { category: "Technical Tasks", points: taskPoints, pct: Math.round((taskPoints / absTotal) * 100) },
      { category: "Events & Competitions", points: eventPoints, pct: Math.round((eventPoints / absTotal) * 100) },
      { category: "Volunteer & Bonuses", points: volunteerPoints + bonusPoints + manualAdjustments, pct: Math.round(((volunteerPoints + bonusPoints + manualAdjustments) / absTotal) * 100) },
    ];

    // Find highest and lowest categories
    categories.sort((a, b) => b.points - a.points);
    const highestCategory = categories[0] ? `${categories[0].category} (${categories[0].pct}%)` : "N/A";
    const lowestCategory = categories[categories.length - 1] ? `${categories[categories.length - 1].category} (${categories[categories.length - 1].pct}%)` : "N/A";

    const avgPointsPerMember = Math.round(totalPoints / totalMembersCount);

    // Dynamic Distribution Trend Calculation
    let distributionTrend = "→ Stable Distribution";
    if (totalPoints > 0) {
      distributionTrend = `↑ Positive Accumulation (Avg ${avgPointsPerMember} Pts/Member)`;
    }

    return {
      attendancePoints: attPoints,
      taskPoints,
      eventPoints,
      volunteerPoints,
      bonusPoints,
      penaltyPoints,
      manualAdjustments,
      totalPoints,
      avgPointsPerMember,
      highestCategory,
      lowestCategory,
      distributionTrend,
      categories,
    };
  }
}
