/**
 * Public Domain - Public Leaderboard Action
 * Strictly exposes non-sensitive member leaderboard metrics for the public portal.
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
  badgeTier: "Gold Vanguard" | "Silver Contributor" | "Bronze Member" | "Member";
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

function deriveBadgeTier(points: number): "Gold Vanguard" | "Silver Contributor" | "Bronze Member" | "Member" {
  if (points >= 200) return "Gold Vanguard";
  if (points >= 100) return "Silver Contributor";
  if (points >= 50) return "Bronze Member";
  return "Member";
}

export async function getPublicLeaderboardAction(): Promise<{
  success: boolean;
  data?: PublicLeaderboardItem[];
  error?: string;
}> {
  logger.info("[PublicAction: getPublicLeaderboardAction] Fetching public leaderboard rankings");

  try {
    // 1. Fetch active members
    const { data: membersData, error: memErr } = await supabase
      .from("members")
      .select("id, name, member_id, club_membership_id, roll_number, branch")
      .eq("status", "active")
      .is("deleted_at", null);

    if (memErr || !membersData) {
      logger.error("[PublicAction] Failed to load members", memErr);
      return { success: false, error: "Failed to load public leaderboard" };
    }

    // 2. Fetch points ledger entries
    const { data: pointsData } = await supabase
      .from("points_ledger")
      .select("member_id, points, is_revoked");

    const pointsMap: Record<string, number> = {};
    if (pointsData) {
      for (const entry of pointsData) {
        if (entry.is_revoked) continue;
        const mId = entry.member_id;
        pointsMap[mId] = (pointsMap[mId] || 0) + (Number(entry.points) || 0);
      }
    }

    // 3. Fetch attendance records for attendance rate calculation
    const [recsRes, sessRes] = await Promise.all([
      supabase.from("attendance_records").select("member_id, status"),
      supabase.from("attendance_sessions").select("id").is("deleted_at", null),
    ]);

    const totalSessionsCount = sessRes.data?.length || 1;
    const presentMap: Record<string, number> = {};
    if (recsRes.data) {
      for (const rec of recsRes.data) {
        if (rec.status === "present" || rec.status === "late") {
          presentMap[rec.member_id] = (presentMap[rec.member_id] || 0) + 1;
        }
      }
    }

    // 4. Fetch completed tasks count
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

    // 5. Construct public leaderboard items without sensitive data
    const rawItems: Array<Omit<PublicLeaderboardItem, "rank">> = membersData.map((m: any) => {
      const memberIdStr = m.member_id || m.club_membership_id || "SAC-RC-000";
      const totalPoints = pointsMap[m.id] || 0;
      const presentCount = presentMap[m.id] || 0;
      const attendanceRate = Math.min(100, Math.round((presentCount / Math.max(1, totalSessionsCount)) * 100));
      const tasksCompleted = taskMap[m.id] || 0;
      const branch = deriveBranch(m.roll_number, m.branch);
      const badgeTier = deriveBadgeTier(totalPoints);

      return {
        memberName: m.name || "Anonymous Member",
        membershipId: memberIdStr,
        branch,
        totalPoints,
        attendanceRate,
        tasksCompleted,
        badgeTier,
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
