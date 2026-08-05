import { logger } from "@/core/logger";
import { normalizeBranch } from "@/constants/branches";
import { AttendanceReportService } from "./attendance-report.service";
import { MemberReportService } from "./member-report.service";
import { PointsReportService } from "./points-report.service";
import { OperationsReportService } from "./operations-report.service";
import { TeamStudioReportService } from "./team-studio-report.service";

export interface DepartmentParticipationRow {
  branch: string;
  membersCount: number;
  attendancePct: number;
  tasksDone: number;
  eventsDone: number;
  pointsShare: number;
  growthPct: number;
}

export interface ClubGrowthRow {
  semesterName: string;
  academicYear: string;
  members: number;
  renewals: number;
  attendancePct: number;
  events: number;
  tasks: number;
  points: number;
  growthTrend: string;
}

export class SemesterReportService {
  private attReportService = new AttendanceReportService();
  private memReportService = new MemberReportService();
  private ptsReportService = new PointsReportService();
  private opsReportService = new OperationsReportService();
  private tsReportService = new TeamStudioReportService();

  /**
   * 1. Department Participation Report — Pure Aggregation Layer
   */
  public async getDepartmentParticipationReport(filters: any = {}): Promise<DepartmentParticipationRow[]> {
    logger.info("[SemesterReportService] Aggregating Department Participation Report from domain services", filters);

    const [attSummary, memDirectory, leaderboard, taskSummary, events] = await Promise.all([
      this.attReportService.getAttendanceSummaryReport(filters),
      this.memReportService.getMemberDirectoryReport(filters),
      this.ptsReportService.getLeaderboardReport(filters),
      this.opsReportService.getTaskCompletionSummary(filters),
      this.opsReportService.getEventsReport(filters),
    ]);

    const branchMap = new Map<
      string,
      { membersCount: number; attPctSum: number; tasksDone: number; eventsDone: number; pointsShare: number }
    >();

    // Aggregate members count & branch breakdown (Single Source of Truth: normalizeBranch)
    for (const m of memDirectory) {
      const b = normalizeBranch(m.branch);
      const existing = branchMap.get(b) || { membersCount: 0, attPctSum: 0, tasksDone: 0, eventsDone: 0, pointsShare: 0 };
      existing.membersCount++;
      branchMap.set(b, existing);
    }

    // Aggregate points & attendance from Leaderboard
    for (const l of leaderboard) {
      const b = normalizeBranch(l.branch);
      const existing = branchMap.get(b) || { membersCount: 1, attPctSum: 0, tasksDone: 0, eventsDone: 0, pointsShare: 0 };
      existing.pointsShare += l.points || 0;
      existing.attPctSum += l.attendancePct || 0;
      existing.tasksDone += l.tasksDone || 0;
      existing.eventsDone += l.eventsDone || 0;
      branchMap.set(b, existing);
    }

    if (branchMap.size === 0) {
      return [];
    }

    const totalPoints = Array.from(branchMap.values()).reduce((sum, v) => sum + v.pointsShare, 0);

    return Array.from(branchMap.entries()).map(([branch, stats]) => {
      const avgAtt = stats.membersCount > 0 ? Math.round(stats.attPctSum / stats.membersCount) : attSummary.avgAttendancePct;
      const pointsPct = totalPoints > 0 ? Math.round((stats.pointsShare / totalPoints) * 100) : 0;

      return {
        branch,
        membersCount: stats.membersCount,
        attendancePct: avgAtt,
        tasksDone: stats.tasksDone,
        eventsDone: stats.eventsDone,
        pointsShare: stats.pointsShare,
        growthPct: pointsPct,
      };
    });
  }

  /**
   * 2. Club Growth Report — Pure Aggregation Layer
   */
  public async getClubGrowthReport(filters: any = {}): Promise<ClubGrowthRow[]> {
    logger.info("[SemesterReportService] Aggregating Club Growth Report from domain services", filters);

    const [attSummary, renData, ptsDist, taskSummary, events] = await Promise.all([
      this.attReportService.getAttendanceSummaryReport(filters),
      this.memReportService.getMembershipRenewalReport(filters),
      this.ptsReportService.getPointsDistributionReport(filters),
      this.opsReportService.getTaskCompletionSummary(filters),
      this.opsReportService.getEventsReport(filters),
    ]);

    const activeSemRow: ClubGrowthRow = {
      semesterName: filters.semester || "ROBOTICS_B1_2026",
      academicYear: filters.academicYear || "2025-2026",
      members: renData.currentMembersCount,
      renewals: renData.renewedMembersCount,
      attendancePct: attSummary.avgAttendancePct,
      events: events.length,
      tasks: taskSummary.completedTasks,
      points: ptsDist.totalPoints,
      growthTrend: `↑ +${Math.round(renData.currentMembersCount > 0 ? (renData.renewedMembersCount / renData.currentMembersCount) * 100 : 100)}% Enrollment Retention`,
    };

    return [activeSemRow];
  }
}
