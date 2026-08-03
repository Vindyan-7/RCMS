/**
 * Academic Domain - Semester Context Service
 *
 * Centralized single source of truth for active semester context across the application.
 * All operational modules (Attendance, Points Engine, Task Center, Operations) consume this service
 * to enforce operational rules, active semester inheritance, and validation.
 */

import { SemestersRepository } from "@/repositories/members/semesters.repository";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { SemesterSelect, AcademicYearSelect, MemberSelect, MembershipSelect } from "@/db/schema";
import { db } from "@/db";
import { academicYears } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ConflictError } from "@/core/errors";
import { logger } from "@/core/logger";

export interface SemesterContextMetadata {
  activeSemester: SemesterSelect | null;
  academicYear: AcademicYearSelect | null;
  isOperationAllowed: boolean;
  enrolledMemberCount: number;
}

export class SemesterContextService {
  constructor(
    private readonly semestersRepo: SemestersRepository = new SemestersRepository(),
    private readonly membershipsRepo: MembershipsRepository = new MembershipsRepository()
  ) {}

  /**
   * Retrieves the currently active semester from the system.
   * Returns null if no semester is currently active.
   */
  public async getActiveSemester(): Promise<SemesterSelect | null> {
    logger.debug("[SemesterContextService] Fetching active semester");
    return this.semestersRepo.findActive();
  }

  /**
   * Returns the active semester ID string or null if none active.
   */
  public async getActiveSemesterId(): Promise<string | null> {
    const active = await this.getActiveSemester();
    return active ? active.id : null;
  }

  /**
   * Ensures an active semester exists and returns it.
   * Throws ConflictError if no active semester is configured.
   */
  public async ensureActiveSemester(operationName = "Club operations"): Promise<SemesterSelect> {
    const active = await this.getActiveSemester();
    if (!active) {
      logger.warn(`[SemesterContextService] ${operationName} blocked — no active semester`);
      throw new ConflictError(
        `${operationName} require an Active Semester. Please activate a semester in the Semester Lifecycle management page first.`,
        "NO_ACTIVE_SEMESTER"
      );
    }
    return active;
  }

  /**
   * Validates whether write/operational actions are permitted.
   */
  public async isOperationAllowed(): Promise<boolean> {
    const active = await this.getActiveSemester();
    return active !== null;
  }

  /**
   * Retrieves current Academic Year linked to the active semester.
   */
  public async getCurrentAcademicYear(): Promise<AcademicYearSelect | null> {
    const active = await this.getActiveSemester();
    if (!active) return null;

    const result = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, active.academicYearId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Returns all active memberships enrolled in the active semester.
   */
  public async getEnrolledMemberships(): Promise<MembershipSelect[]> {
    const active = await this.getActiveSemester();
    if (!active) return [];
    const profiles = await this.membershipsRepo.findEnrolledMembersWithProfiles(active.id);
    return profiles.map((p) => p.membership);
  }

  /**
   * Returns full Member directory records enrolled in the active semester.
   */
  public async getEnrolledMembers(): Promise<MemberSelect[]> {
    const active = await this.getActiveSemester();
    if (!active) return [];
    const profiles = await this.membershipsRepo.findEnrolledMembersWithProfiles(active.id);
    return profiles.map((p) => p.member);
  }

  /**
   * Returns count of members enrolled in the active semester.
   */
  public async getEnrolledMemberCount(): Promise<number> {
    const members = await this.getEnrolledMembers();
    return members.length;
  }

  /**
   * Checks if a member is enrolled in the active semester.
   */
  public async isMemberEnrolled(memberId: string): Promise<boolean> {
    const active = await this.getActiveSemester();
    if (!active) return false;
    const membership = await this.membershipsRepo.findActiveMembership(memberId);
    return membership !== null && membership.semesterId === active.id && membership.status === "active";
  }

  /**
   * Returns full metadata payload for operational modules.
   */
  public async getSemesterMetadata(): Promise<SemesterContextMetadata> {
    const activeSemester = await this.getActiveSemester();
    const academicYear = activeSemester ? await this.getCurrentAcademicYear() : null;
    const enrolledMemberCount = activeSemester ? await this.getEnrolledMemberCount() : 0;

    return {
      activeSemester,
      academicYear,
      isOperationAllowed: activeSemester !== null,
      enrolledMemberCount,
    };
  }
}
