import { supabase } from "@/db";
import { logger } from "@/core/logger";
import { normalizeBranch } from "@/constants/branches";

export interface TeamGenerationReportRow {
  attendanceSession: string;
  semester: string;
  generationTime: string;
  generatedBy: string;
  algorithm: string;
  teamSize: number;
  totalTeams: number;
  totalMembers: number;
  avgTeamSize: number;
}

export interface CollaborationIntelligenceRow {
  memberName: string;
  membershipId: string;
  branch: string;
  year: number;
  uniqueCollaborators: number;
  mostFrequentCollaborator: string;
  repeatedPairings: number;
  collaborationDiversityPct: number;
  neverWorkedWithCount: number;
}

export interface TeamStudioTimelineRow {
  timestamp: string;
  session: string;
  activity: string;
  description: string;
  coordinator: string;
  affectedMembers: number;
  algorithm: string;
}

export class TeamStudioReportService {

  /**
   * 1. Team Generation Report — Live Database Query
   */
  public async getTeamGenerationReport(filters: any = {}): Promise<TeamGenerationReportRow[]> {
    logger.info("[TeamStudioReportService] Querying Team Generation Report from live database");

    const { data: gens, error } = await supabase
      .from("team_generations")
      .select("id, algorithm, team_size, total_teams, total_members, generated_by, created_at, attendance_sessions(title)")
      .order("created_at", { ascending: false });

    if (error || !gens || gens.length === 0) {
      return [];
    }

    let rows: TeamGenerationReportRow[] = gens.map((g: any) => {
      const sess = Array.isArray(g.attendance_sessions) ? g.attendance_sessions[0] : g.attendance_sessions;
      const teamSize = g.team_size || 4;
      const totalTeams = g.total_teams || 1;
      const totalMembers = g.total_members || 0;
      const avgSize = totalTeams > 0 ? Math.round((totalMembers / totalTeams) * 10) / 10 : teamSize;

      let algoTitle = "Smart Collaboration Engine";
      const alg = (g.algorithm || "").toLowerCase();
      if (alg.includes("branch") || alg.includes("balance")) algoTitle = "Balanced Branch & Year";
      else if (alg.includes("random")) algoTitle = "Random Team Builder";

      const genTimeStr = g.created_at ? new Date(g.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "N/A";

      return {
        attendanceSession: sess?.title || "Team Studio Session",
        semester: "ROBOTICS_B1_2026",
        generationTime: genTimeStr,
        generatedBy: g.generated_by || "Faculty Coordinator",
        algorithm: algoTitle,
        teamSize,
        totalTeams,
        totalMembers,
        avgTeamSize: avgSize,
      };
    });

    return rows;
  }

  /**
   * 2. Collaboration Intelligence Report — Live Matrix Calculation
   */
  public async getCollaborationIntelligenceReport(filters: any = {}): Promise<CollaborationIntelligenceRow[]> {
    logger.info("[TeamStudioReportService] Calculating Collaboration Intelligence Report from live database");

    const [memsRes, collabRes] = await Promise.all([
      supabase.from("members").select("id, name, member_id, club_membership_id, branch, year").eq("status", "active").is("deleted_at", null),
      supabase.from("member_collaborations").select("member_a_id, member_b_id, times_worked_together"),
    ]);

    const members = memsRes.data || [];
    const collabs = collabRes.data || [];

    if (members.length === 0) {
      return [];
    }

    let filteredMembers = members;
    if (filters.branch && filters.branch !== "all") {
      filteredMembers = filteredMembers.filter((m: any) => m.branch && m.branch.toLowerCase() === filters.branch.toLowerCase());
    }
    if (filters.year && filters.year !== "all") {
      filteredMembers = filteredMembers.filter((m: any) => String(m.year) === String(filters.year));
    }

    const memberMap = new Map<string, string>();
    members.forEach((m: any) => memberMap.set(m.id, m.name));

    // Map partner stats per member ID: partnerId -> times
    const partnerMap = new Map<string, Map<string, number>>();

    for (const c of collabs) {
      const a = c.member_a_id;
      const b = c.member_b_id;
      const times = c.times_worked_together || 1;

      // A -> B
      const aMap = partnerMap.get(a) || new Map<string, number>();
      aMap.set(b, (aMap.get(b) || 0) + times);
      partnerMap.set(a, aMap);

      // B -> A
      const bMap = partnerMap.get(b) || new Map<string, number>();
      bMap.set(a, (bMap.get(a) || 0) + times);
      partnerMap.set(b, bMap);
    }

    const totalActiveCount = Math.max(1, members.length - 1);

    return filteredMembers.map((m: any) => {
      const pMap = partnerMap.get(m.id) || new Map<string, number>();
      const uniqueCount = pMap.size;

      let topPartnerName = "None Yet";
      let topTimes = 0;
      let repeatedPairings = 0;

      for (const [pId, times] of pMap.entries()) {
        if (times > 1) repeatedPairings++;
        if (times > topTimes) {
          topTimes = times;
          const pName = memberMap.get(pId) || "Teammate";
          topPartnerName = `${pName} (${times} times)`;
        }
      }

      const diversityPct = Math.min(100, Math.round((uniqueCount / totalActiveCount) * 100));
      const neverWorked = Math.max(0, totalActiveCount - uniqueCount);

      return {
        memberName: m.name || "Member",
        membershipId: m.club_membership_id || m.member_id || "SAC-RC-0000",
        branch: normalizeBranch(m.branch),
        year: m.year || 1,
        uniqueCollaborators: uniqueCount,
        mostFrequentCollaborator: topPartnerName,
        repeatedPairings,
        collaborationDiversityPct: diversityPct,
        neverWorkedWithCount: neverWorked,
      };
    });
  }

  /**
   * 3. Team Studio Activity Timeline Report — Live Chronological Log
   */
  public async getTeamStudioTimelineReport(filters: any = {}): Promise<TeamStudioTimelineRow[]> {
    logger.info("[TeamStudioReportService] Building live Team Studio Activity Timeline Report");

    const { data: gens, error } = await supabase
      .from("team_generations")
      .select("id, algorithm, team_size, total_teams, total_members, generated_by, created_at, attendance_sessions(title)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !gens || gens.length === 0) {
      return [];
    }

    return gens.map((g: any) => {
      const sess = Array.isArray(g.attendance_sessions) ? g.attendance_sessions[0] : g.attendance_sessions;
      const genTimeStr = g.created_at ? new Date(g.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "N/A";

      let algoTitle = "Smart Collaboration Engine";
      const alg = (g.algorithm || "").toLowerCase();
      if (alg.includes("branch") || alg.includes("balance")) algoTitle = "Balanced Branch & Year";
      else if (alg.includes("random")) algoTitle = "Random Team Builder";

      return {
        timestamp: genTimeStr,
        session: sess?.title || "Live Attendance Session",
        activity: "Team Generation",
        description: `Generated ${g.total_teams || 1} teams for ${g.total_members || 0} members using ${algoTitle}`,
        coordinator: g.generated_by || "Faculty Coordinator",
        affectedMembers: g.total_members || 0,
        algorithm: algoTitle,
      };
    });
  }
}
