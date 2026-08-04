/**
 * Public Domain - Public Leaderboard Action
 * Strictly exposes non-sensitive member leaderboard metrics for active semester enrolled members.
 */

import { supabase, isServerless, toCamelCase } from "@/db";
import { logger } from "@/core/logger";

export interface PublicLeaderboardItem {
  rank: number;
  memberName: string;
  membershipId: string;
  branch: string;
  totalPoints: number;
  attendanceRate: number; // e.g. 85 (%)
  tasksCompleted: number; // count
}

function deriveBranch(rollNumber: string | null, rawBranch: string | null): string {
  if (rawBranch && rawBranch.trim().length > 0) {
    return rawBranch.trim().toUpperCase();
  }
  if (!rollNumber) return "ROBOTICS";

  const upper = rollNumber.toUpperCase();
  if (upper.includes("A05") || upper.includes("CSE")) return "CSE";
  if (upper.includes("A04") || upper.includes("ECE")) return "ECE";
  if (upper.includes("A02") || upper.includes("EEE")) return "EEE";
  if (upper.includes("A03") || upper.includes("MECH")) return "MECH";
  if (upper.includes("A01") || upper.includes("CIVIL")) return "CIVIL";
  if (upper.includes("A12") || upper.includes("IT")) return "IT";
  if (upper.includes("A66") || upper.includes("AIML") || upper.includes("CSM")) return "AI/ML";
  return "ECE";
}

export async function getPublicLeaderboardAction(): Promise<{
  success: boolean;
  data?: PublicLeaderboardItem[];
  error?: string;
}> {
  logger.info("[PublicAction: getPublicLeaderboardAction] Fetching public leaderboard rankings for active semester");

  try {
    // 1. Get active semester
    const { data: semData } = await supabase
      .from("semesters")
      .select("id")
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(1);

    const activeSemesterId = semData && semData[0] ? semData[0].id : null;

    // 2. Fetch enrolled members for active semester (or fallback to active members)
    let enrolledMembers: any[] = [];
    if (activeSemesterId) {
      const { data: memsData } = await supabase
        .from("memberships")
        .select("member_id, members(id, name, member_id, club_membership_id, roll_number, branch, status)")
        .eq("semester_id", activeSemesterId)
        .eq("status", "active")
        .is("deleted_at", null);

      if (memsData && memsData.length > 0) {
        enrolledMembers = memsData
          .filter((m: any) => m.members && m.members.status === "active")
          .map((m: any) => m.members);
      }
    }

    // Fallback if no active semester memberships found
    if (enrolledMembers.length === 0) {
      const { data: allMems } = await supabase
        .from("members")
        .select("id, name, member_id, club_membership_id, roll_number, branch")
        .eq("status", "active")
        .is("deleted_at", null);
      enrolledMembers = allMems || [];
    }

    // 3. Fetch points ledger entries for total points
    const { data: pointsData } = await supabase
      .from("points_ledger")
      .select("member_id, points, is_revoked, semester_id");

    const pointsMap: Record<string, number> = {};
    if (pointsData) {
      for (const entry of pointsData) {
        if (entry.is_revoked) continue;
        if (activeSemesterId && entry.semester_id && entry.semester_id !== activeSemesterId) continue;
        const mId = entry.member_id;
        pointsMap[mId] = (pointsMap[mId] || 0) + (Number(entry.points) || 0);
      }
    }

    // 4. Fetch attendance sessions & records
    let sessionCount = 0;
    let recsData: any[] = [];

    if (activeSemesterId) {
      const { data: sessData } = await supabase
        .from("attendance_sessions")
        .select("id")
        .eq("semester_id", activeSemesterId)
        .is("deleted_at", null);

      sessionCount = sessData?.length || 0;
      const sessionIds = (sessData || []).map((s: any) => s.id);

      if (sessionIds.length > 0) {
        const { data: recs } = await supabase
          .from("attendance_records")
          .select("member_id")
          .in("session_id", sessionIds);
        recsData = recs || [];
      }
    }

    if (recsData.length === 0) {
      const [sessRes, recsRes] = await Promise.all([
        supabase.from("attendance_sessions").select("id").is("deleted_at", null),
        supabase.from("attendance_records").select("member_id"),
      ]);
      sessionCount = sessRes.data?.length || 0;
      recsData = recsRes.data || [];
    }

    const presentMap: Record<string, number> = {};
    for (const rec of recsData) {
      if (rec.member_id) {
        presentMap[rec.member_id] = (presentMap[rec.member_id] || 0) + 1;
      }
    }

    // 5. Fetch task completions
    const { data: completionsData } = await supabase
      .from("task_completions")
      .select("member_id, is_revoked");

    const taskMap: Record<string, number> = {};
    if (completionsData) {
      for (const comp of completionsData) {
        if (comp.is_revoked) continue;
        taskMap[comp.member_id] = (taskMap[comp.member_id] || 0) + 1;
      }
    }

    // 6. Map to public leaderboard items (Strictly no email, phone, or UUIDs)
    const rawItems: Array<Omit<PublicLeaderboardItem, "rank">> = enrolledMembers.map((m: any) => {
      const memberIdStr = m.member_id || m.club_membership_id || "SAC-RC-000";
      const totalPoints = pointsMap[m.id] || 0;
      const presentCount = presentMap[m.id] || 0;
      
      let attendanceRate = 0;
      if (sessionCount > 0) {
        attendanceRate = Math.min(100, Math.round((presentCount / sessionCount) * 100));
      } else if (presentCount > 0) {
        attendanceRate = 100;
      } else {
        // Default to 100% when no sessions created yet in semester
        attendanceRate = 100;
      }

      const tasksCompleted = taskMap[m.id] || 0;
      const branch = deriveBranch(m.roll_number, m.branch);

      return {
        memberName: m.name || "Anonymous Member",
        membershipId: memberIdStr,
        branch,
        totalPoints,
        attendanceRate,
        tasksCompleted,
      };
    });

    // Sort descending by totalPoints, secondary sort by tasksCompleted
    rawItems.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.tasksCompleted - a.tasksCompleted;
    });

    // Assign rank 1, 2, 3...
    const leaderboard: PublicLeaderboardItem[] = rawItems.map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));

    return {
      success: true,
      data: leaderboard,
    };
  } catch (error) {
    logger.error("[PublicAction: getPublicLeaderboardAction] Execution failed", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
