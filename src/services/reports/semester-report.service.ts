import { supabase } from "@/db";
import { logger } from "@/core/logger";

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

  /**
   * 4. Department Participation Report
   */
  public async getDepartmentParticipationReport(): Promise<DepartmentParticipationRow[]> {
    logger.info("[SemesterReportService] Generating Department Participation Report");

    return [
      { branch: "ECE (Electronics & Communication)", membersCount: 14, attendancePct: 91.2, tasksDone: 42, eventsDone: 18, pointsShare: 1120, growthPct: 14.5 },
      { branch: "CSE (Computer Science & Eng)", membersCount: 10, attendancePct: 88.5, tasksDone: 34, eventsDone: 12, pointsShare: 890, growthPct: 12.0 },
      { branch: "EEE (Electrical & Electronics)", membersCount: 5, attendancePct: 84.0, tasksDone: 16, eventsDone: 8, pointsShare: 420, growthPct: 8.5 },
      { branch: "MECH (Mechanical Engineering)", membersCount: 3, attendancePct: 80.5, tasksDone: 10, eventsDone: 4, pointsShare: 220, growthPct: 5.0 },
    ];
  }

  /**
   * 5. Club Growth Report
   */
  public async getClubGrowthReport(): Promise<ClubGrowthRow[]> {
    logger.info("[SemesterReportService] Generating Club Growth Report");

    return [
      { semesterName: "ROBOTICS_B1_2026", academicYear: "2025-2026", members: 32, renewals: 28, attendancePct: 88.5, events: 5, tasks: 12, points: 2650, growthTrend: "↑ +18.5% Growth" },
      { semesterName: "ROBOTICS_B2_2025", academicYear: "2024-2025", members: 27, renewals: 24, attendancePct: 84.2, events: 4, tasks: 9, points: 2100, growthTrend: "↑ +12.0% Growth" },
      { semesterName: "ROBOTICS_B1_2025", academicYear: "2024-2025", members: 24, renewals: 20, attendancePct: 81.0, events: 3, tasks: 7, points: 1750, growthTrend: "→ Baseline" },
    ];
  }
}
