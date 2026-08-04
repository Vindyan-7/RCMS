import { supabase } from "@/db";
import { logger } from "@/core/logger";

export interface TechnicalTaskRow {
  taskName: string;
  category: string;
  createdDate: string;
  dueDate: string;
  rewardPoints: number;
  completedMembers: number;
  pendingMembers: number;
  completionPct: number;
  verifier: string;
  status: string;
  semester: string;
}

export interface TaskSummaryData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionPct: number;
  avgCompletionPct: number;
  mostCompletedTask: string;
  leastCompletedTask: string;
  avgPointsAwarded: number;
  topContributors: Array<{ name: string; membershipId: string; tasksDone: number }>;
}

export interface EventReportRow {
  eventName: string;
  category: string;
  date: string;
  venue: string;
  organizer: string;
  participants: number;
  verified: number;
  participationPct: number;
  pointsAwarded: number;
  semester: string;
}

export interface VolunteerActivityRow {
  volunteerName: string;
  sessionsManaged: number;
  qrSessions: number;
  pinSessions: number;
  manualSessions: number;
  totalMembersProcessed: number;
  attendanceSessions: number;
  avgProcessingCount: number;
  lastActivity: string;
}

export class OperationsReportService {

  /**
   * 1. Technical Task Report — Live Database Query
   */
  public async getTechnicalTaskReport(filters: any = {}): Promise<TechnicalTaskRow[]> {
    logger.info("[OperationsReportService] Querying Technical Task Report from live database");

    const [tasksRes, compsRes, memsRes] = await Promise.all([
      supabase.from("tasks").select("id, title, category, points, due_date, start_date, status, created_at").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("task_completions").select("task_id, member_id"),
      supabase.from("members").select("id").eq("status", "active").is("deleted_at", null),
    ]);

    const tasks = tasksRes.data || [];
    const completions = compsRes.data || [];
    const totalActiveMembers = Math.max(1, (memsRes.data || []).length);

    if (tasks.length === 0) {
      return [];
    }

    const taskCompsCountMap = new Map<string, number>();
    for (const c of completions) {
      const current = taskCompsCountMap.get(c.task_id) || 0;
      taskCompsCountMap.set(c.task_id, current + 1);
    }

    let rows: TechnicalTaskRow[] = tasks.map((t: any) => {
      const completedCount = taskCompsCountMap.get(t.id) || 0;
      const pendingCount = Math.max(0, totalActiveMembers - completedCount);
      const pct = Math.round((completedCount / totalActiveMembers) * 100);

      const createdDateStr = t.created_at ? new Date(t.created_at).toLocaleDateString([], { dateStyle: "medium" }) : "N/A";
      const dueDateStr = t.due_date ? new Date(t.due_date).toLocaleDateString([], { dateStyle: "medium" }) : (t.start_date ? new Date(t.start_date).toLocaleDateString([], { dateStyle: "medium" }) : "N/A");

      return {
        taskName: t.title || "Technical Task",
        category: t.category || "Hardware",
        createdDate: createdDateStr,
        dueDate: dueDateStr,
        rewardPoints: t.points || 10,
        completedMembers: completedCount,
        pendingMembers: pendingCount,
        completionPct: pct,
        verifier: "Faculty Coordinator",
        status: (t.status || "active").toUpperCase(),
        semester: "ROBOTICS_B1_2026",
      };
    });

    // Apply Client Filters (Category)
    if (filters.category && filters.category !== "all") {
      rows = rows.filter((r) => r.category.toLowerCase() === filters.category.toLowerCase());
    }

    return rows;
  }

  /**
   * 2. Task Completion Summary Report — Live Calculation & Rankings
   */
  public async getTaskCompletionSummary(filters: any = {}): Promise<TaskSummaryData> {
    logger.info("[OperationsReportService] Calculating Task Completion Summary from live database");

    const [tasksRes, compsRes, memsRes] = await Promise.all([
      supabase.from("tasks").select("id, title, points, status").is("deleted_at", null),
      supabase.from("task_completions").select("task_id, member_id"),
      supabase.from("members").select("id, name, member_id, club_membership_id").eq("status", "active").is("deleted_at", null),
    ]);

    const tasks = tasksRes.data || [];
    const completions = compsRes.data || [];
    const members = memsRes.data || [];

    if (tasks.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        completionPct: 0,
        avgCompletionPct: 0,
        mostCompletedTask: "N/A",
        leastCompletedTask: "N/A",
        avgPointsAwarded: 0,
        topContributors: [],
      };
    }

    const totalTasks = tasks.length;
    const taskCompCountMap = new Map<string, number>();
    const memberTaskCountMap = new Map<string, number>();

    let totalPointsDistributed = 0;
    for (const c of completions) {
      const tCount = taskCompCountMap.get(c.task_id) || 0;
      taskCompCountMap.set(c.task_id, tCount + 1);

      const mCount = memberTaskCountMap.get(c.member_id) || 0;
      memberTaskCountMap.set(c.member_id, mCount + 1);
    }

    let completedTasksCount = 0;
    let highestCompCount = -1;
    let highestCompTitle = "N/A";
    let lowestCompCount = Infinity;
    let lowestCompTitle = "N/A";

    const totalActiveMembers = Math.max(1, members.length);

    for (const t of tasks) {
      totalPointsDistributed += t.points || 0;
      const count = taskCompCountMap.get(t.id) || 0;
      const pct = Math.round((count / totalActiveMembers) * 100);

      if (count > 0 || (t.status || "").toLowerCase() === "completed") {
        completedTasksCount++;
      }

      if (count > highestCompCount) {
        highestCompCount = count;
        highestCompTitle = `${t.title} (${pct}%)`;
      }
      if (count < lowestCompCount) {
        lowestCompCount = count;
        lowestCompTitle = `${t.title} (${pct}%)`;
      }
    }

    const pendingTasksCount = Math.max(0, totalTasks - completedTasksCount);
    const overallCompletionPct = Math.round((completedTasksCount / totalTasks) * 100);
    const avgCompletionPct = Math.round((completions.length / Math.max(1, totalTasks * totalActiveMembers)) * 100);
    const avgPointsAwarded = completions.length > 0 ? Math.round(totalPointsDistributed / completions.length) : 0;

    // Top Member Contributors
    const topContributors = members
      .map((m: any) => ({
        name: m.name || "Member",
        membershipId: m.club_membership_id || m.member_id || "SAC-RC-0000",
        tasksDone: memberTaskCountMap.get(m.id) || 0,
      }))
      .filter((m) => m.tasksDone > 0)
      .sort((a, b) => b.tasksDone - a.tasksDone)
      .slice(0, 10);

    return {
      totalTasks,
      completedTasks: completedTasksCount,
      pendingTasks: pendingTasksCount,
      completionPct: overallCompletionPct,
      avgCompletionPct,
      mostCompletedTask: highestCompTitle,
      leastCompletedTask: lowestCompTitle === "N/A" ? highestCompTitle : lowestCompTitle,
      avgPointsAwarded,
      topContributors,
    };
  }

  /**
   * 3. Events Report — Live Database Query
   */
  public async getEventsReport(filters: any = {}): Promise<EventReportRow[]> {
    logger.info("[OperationsReportService] Querying Events Report from live database");

    const [eventsRes, partsRes, memsRes] = await Promise.all([
      supabase.from("events").select("id, name, venue, start_date, points, status").is("deleted_at", null).order("start_date", { ascending: false }),
      supabase.from("event_participations").select("event_id, member_id, verified_at"),
      supabase.from("members").select("id").eq("status", "active").is("deleted_at", null),
    ]);

    const eventsList = eventsRes.data || [];
    const participations = partsRes.data || [];
    const totalActiveMembers = Math.max(1, (memsRes.data || []).length);

    if (eventsList.length === 0) {
      return [];
    }

    const eventPartsMap = new Map<string, { total: number; verified: number }>();
    for (const p of participations) {
      const existing = eventPartsMap.get(p.event_id) || { total: 0, verified: 0 };
      existing.total++;
      if (p.verified_at) existing.verified++;
      eventPartsMap.set(p.event_id, existing);
    }

    return eventsList.map((e: any) => {
      const stats = eventPartsMap.get(e.id) || { total: 0, verified: 0 };
      const verifiedCount = stats.verified || stats.total;
      const pct = Math.round((verifiedCount / totalActiveMembers) * 100);
      const dateStr = e.start_date ? new Date(e.start_date).toLocaleDateString([], { dateStyle: "medium" }) : "N/A";

      return {
        eventName: e.name || "Robotics Event",
        category: "Club Event",
        date: dateStr,
        venue: e.venue || "Robotics Lab #204",
        organizer: "Faculty Coordinator",
        participants: stats.total,
        verified: verifiedCount,
        participationPct: pct,
        pointsAwarded: e.points || 20,
        semester: "ROBOTICS_B1_2026",
      };
    });
  }

  /**
   * 4. Volunteer Activity Report — Live Scanner & Session Audit
   */
  public async getVolunteerActivityReport(filters: any = {}): Promise<VolunteerActivityRow[]> {
    logger.info("[OperationsReportService] Generating Volunteer Activity Report from live attendance scan logs");

    const [usersRes, recsRes, sessRes] = await Promise.all([
      supabase.from("users").select("id, name, role"),
      supabase.from("attendance_records").select("session_id, method, volunteer_user, scan_time"),
      supabase.from("attendance_sessions").select("id, title"),
    ]);

    const users = usersRes.data || [];
    const records = recsRes.data || [];
    const sessions = sessRes.data || [];

    if (records.length === 0) {
      return [];
    }

    // Map volunteer stats per volunteer_user or method
    const volunteerStatsMap = new Map<
      string,
      {
        name: string;
        sessionsSet: Set<string>;
        qrCount: number;
        pinCount: number;
        manualCount: number;
        totalProcessed: number;
        lastActivity: Date | null;
      }
    >();

    const userMap = new Map<string, string>();
    users.forEach((u) => userMap.set(u.id, u.name));

    for (const r of records) {
      const volId = r.volunteer_user || "system_lead";
      const volName = userMap.get(volId) || (volId === "system_lead" ? "Volunteer Scanner Lead" : "Volunteer Coordinator");

      const stats = volunteerStatsMap.get(volId) || {
        name: volName,
        sessionsSet: new Set<string>(),
        qrCount: 0,
        pinCount: 0,
        manualCount: 0,
        totalProcessed: 0,
        lastActivity: null,
      };

      stats.sessionsSet.add(r.session_id);
      stats.totalProcessed++;

      const methodLower = (r.method || "qr").toLowerCase();
      if (methodLower === "qr") stats.qrCount++;
      else if (methodLower === "pin") stats.pinCount++;
      else stats.manualCount++;

      if (r.scan_time) {
        const scanDate = new Date(r.scan_time);
        if (!stats.lastActivity || scanDate > stats.lastActivity) {
          stats.lastActivity = scanDate;
        }
      }

      volunteerStatsMap.set(volId, stats);
    }

    return Array.from(volunteerStatsMap.values()).map((v) => {
      const sessCount = v.sessionsSet.size;
      const avgProc = sessCount > 0 ? Math.round(v.totalProcessed / sessCount) : v.totalProcessed;
      const lastActStr = v.lastActivity ? v.lastActivity.toLocaleDateString([], { dateStyle: "medium" }) : "N/A";

      return {
        volunteerName: v.name,
        sessionsManaged: sessCount,
        qrSessions: v.qrCount,
        pinSessions: v.pinCount,
        manualSessions: v.manualCount,
        totalMembersProcessed: v.totalProcessed,
        attendanceSessions: sessions.length,
        avgProcessingCount: avgProc,
        lastActivity: lastActStr,
      };
    });
  }
}
