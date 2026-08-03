/**
 * Academic Domain - Semester Dashboard Service Implementation
 *
 * Aggregates dashboard data for the Semester & Membership Lifecycle workspace.
 * Keeps domain boundaries clean by orchestrating queries across Semesters, Members,
 * Academic Years, and Memberships repositories without introducing cross-domain joins.
 */

import { SemestersRepository } from "@/repositories/members/semesters.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { db } from "@/db";
import { academicYears, AcademicYearSelect, MemberSelect, MembershipSelect, SemesterSelect } from "@/db/schema";
import { isNull, desc } from "drizzle-orm";
import { logger } from "@/core/logger";

export interface SemesterDashboardData {
  semesters: SemesterSelect[];
  members: MemberSelect[];
  academicYears: AcademicYearSelect[];
  activeMemberships: Record<string, MembershipSelect>;
}

export class SemesterDashboardService {
  constructor(
    private readonly semestersRepo: SemestersRepository,
    private readonly membersRepo: MembersRepository,
    private readonly membershipsRepo: MembershipsRepository
  ) {}

  public async getDashboardData(): Promise<SemesterDashboardData> {
    logger.info("[SemesterDashboardService] Fetching consolidated dashboard data");

    const { getAllAcademicYearsAction } = await import("@/actions/academic/academic_years.actions");
    const [semestersResult, membersResult, yearsRes] = await Promise.all([
      this.semestersRepo.findAll({ limit: 1000 }),
      this.membersRepo.findAll({ limit: 1000 }, { includeCount: false }),
      getAllAcademicYearsAction(),
    ]);

    const semesters = semestersResult.items;
    const members = membersResult.items;
    const academicYearsList = yearsRes.success && yearsRes.data ? yearsRes.data : [];

    // Phase 2: Single batch query for active memberships using retrieved member IDs
    const memberIds = members.map((m) => m.id);
    const activeMemberships = await this.membershipsRepo.findAllActiveMemberships(memberIds);

    return {
      semesters,
      members,
      academicYears: academicYearsList,
      activeMemberships,
    };
  }
}
