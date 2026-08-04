import { supabase } from "@/db";
import { logger } from "@/core/logger";

export interface AttendanceSessionSummary {
  sessionId: string;
  title: string;
  date: string;
  semesterName: string;
  attendanceType: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  completionTime: string;
  coordinatorName: string;
}

export interface PresentMemberItem {
  memberId: string;
  name: string;
  membershipId: string;
  branch: string;
  year: number;
}

export interface TeamStudioInitialResponse {
  activeSemesterName: string;
  completedLiveSessions: AttendanceSessionSummary[];
  selectedSession: AttendanceSessionSummary | null;
  presentMembers: PresentMemberItem[];
}

export class TeamStudioService {
  public async getTeamStudioInitialData(selectedSessionId?: string): Promise<TeamStudioInitialResponse> {
    logger.info("[TeamStudioService] Fetching Team Studio foundation data for completed LIVE attendance sessions");

    // 1. Fetch active semester
    const { data: semData } = await supabase
      .from("semesters")
      .select("id, name")
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(1);

    const activeSem = semData && semData[0] ? semData[0] : null;
    const activeSemesterName = activeSem?.name || "ROBOTICS_B1_2026";

    // 2. Fetch ALL completed LIVE attendance sessions
    let sessQuery = supabase
      .from("attendance_sessions")
      .select("id, title, date, status, type, semester_id, created_at, updated_at, created_by, semesters(name)")
      .eq("status", "completed")
      .eq("type", "live")
      .is("deleted_at", null)
      .order("date", { ascending: false });

    if (activeSem?.id) {
      sessQuery = sessQuery.eq("semester_id", activeSem.id);
    }

    const { data: rawSessions } = await sessQuery;
    const sessions = rawSessions || [];

    if (sessions.length === 0) {
      // Return empty state response if no completed live session exists
      return {
        activeSemesterName,
        completedLiveSessions: [],
        selectedSession: null,
        presentMembers: [],
      };
    }

    // 3. Collect session IDs and fetch attendance records & members
    const sessionIds = sessions.map((s: any) => s.id);
    const [attRecRes, memsCountRes] = await Promise.all([
      supabase.from("attendance_records").select("id, session_id, member_id, late, scan_time").in("session_id", sessionIds),
      supabase.from("members").select("id, status").eq("status", "active").is("deleted_at", null),
    ]);

    const attRecords = attRecRes.data || [];
    const totalEnrolledCount = (memsCountRes.data || []).length || 1;

    // Group records by session
    const sessionRecordsMap: Record<string, any[]> = {};
    attRecords.forEach((r: any) => {
      if (!sessionRecordsMap[r.session_id]) {
        sessionRecordsMap[r.session_id] = [];
      }
      sessionRecordsMap[r.session_id].push(r);
    });

    const completedLiveSessions: AttendanceSessionSummary[] = sessions.map((s: any) => {
      const recs = sessionRecordsMap[s.id] || [];
      const presentCount = recs.length;
      const lateCount = recs.filter((r: any) => r.late).length;
      const absentCount = Math.max(0, totalEnrolledCount - presentCount);

      const semName = s.semesters?.name || activeSemesterName;
      const compDate = s.updated_at ? new Date(s.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "17:30 PM";

      return {
        sessionId: s.id,
        title: s.title || "Robotics Live Session",
        date: s.date || new Date().toISOString().split("T")[0],
        semesterName: semName,
        attendanceType: "LIVE",
        presentCount,
        absentCount,
        lateCount,
        completionTime: compDate,
        coordinatorName: "Faculty Coordinator",
      };
    });

    // Determine target session (selected or default to latest)
    let targetSession = completedLiveSessions[0];
    if (selectedSessionId) {
      const found = completedLiveSessions.find((s) => s.sessionId === selectedSessionId);
      if (found) targetSession = found;
    }

    // 4. Fetch present members strictly for the target session
    const targetRecs = sessionRecordsMap[targetSession.sessionId] || [];
    const targetMemberIds = targetRecs.map((r: any) => r.member_id).filter(Boolean);

    let presentMembers: PresentMemberItem[] = [];
    if (targetMemberIds.length > 0) {
      const { data: membersData } = await supabase
        .from("members")
        .select("id, name, member_id, club_membership_id, branch, year")
        .in("id", targetMemberIds)
        .is("deleted_at", null);

      if (membersData) {
        presentMembers = membersData.map((m: any) => ({
          memberId: m.id,
          name: m.name || "Member",
          membershipId: m.club_membership_id || m.member_id || "SAC-RC-0000",
          branch: (m.branch || "ECE").toUpperCase(),
          year: m.year || 1,
        }));
      }
    }

    return {
      activeSemesterName,
      completedLiveSessions,
      selectedSession: targetSession,
      presentMembers,
    };
  }
}
