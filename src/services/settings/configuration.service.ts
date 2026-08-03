/**
 * System Settings Domain - Centralized Configuration Access Layer Service
 */

import { SystemSettingsRepository } from "@/repositories/settings/system_settings.repository";
import { UUID } from "@/core/types";
import { logger } from "@/core/logger";

export interface RCMSGlobalConfiguration {
  // Phase 1: Club Settings
  clubName: string;
  collegeName: string;
  academicYearDisplay: string;
  logoUrl: string;
  defaultTimezone: string;
  defaultCurrency: string;
  clubDescription: string;

  // Phase 2: Attendance Settings
  defaultSessionDuration: number; // minutes
  defaultLateThreshold: number; // minutes
  defaultAttendancePoints: number;
  defaultLateAttendancePoints: number;
  defaultVolunteerPinExpiry: number; // minutes

  // Phase 3: Points Settings
  defaultTaskPoints: number;
  defaultAttendanceReward: number;
  defaultEventReward: number;
  defaultVolunteerReward: number;
  defaultManualAward: number;
  defaultPenalty: number;

  // Phase 4: Semester Defaults
  defaultSemesterLength: number; // days
  defaultSemesterNamingPattern: string;
  membershipRenewalGracePeriod: number; // days
  defaultEnrollmentStatus: string;

  // Phase 5: Operations Defaults
  defaultEventDuration: number; // minutes
  defaultTaskStatus: string;
  defaultEventStatus: string;
}

export const DEFAULT_RCMS_CONFIG: RCMSGlobalConfiguration = {
  // Phase 1: Club
  clubName: "Robotics & Automation Club",
  collegeName: "Vindyan Institute of Technology",
  academicYearDisplay: "2025–2026",
  logoUrl: "",
  defaultTimezone: "Asia/Kolkata",
  defaultCurrency: "INR",
  clubDescription: "Official Robotics and Computational Engineering Club",

  // Phase 2: Attendance
  defaultSessionDuration: 60,
  defaultLateThreshold: 15,
  defaultAttendancePoints: 15,
  defaultLateAttendancePoints: 5,
  defaultVolunteerPinExpiry: 120,

  // Phase 3: Points
  defaultTaskPoints: 10,
  defaultAttendanceReward: 15,
  defaultEventReward: 20,
  defaultVolunteerReward: 25,
  defaultManualAward: 25,
  defaultPenalty: 10,

  // Phase 4: Semester
  defaultSemesterLength: 180,
  defaultSemesterNamingPattern: "Spring {year}",
  membershipRenewalGracePeriod: 14,
  defaultEnrollmentStatus: "active",

  // Phase 5: Operations
  defaultEventDuration: 180,
  defaultTaskStatus: "active",
  defaultEventStatus: "published",
};

export class ConfigurationService {
  constructor(
    private readonly settingsRepo: SystemSettingsRepository = new SystemSettingsRepository()
  ) {}

  public async getFullConfiguration(): Promise<RCMSGlobalConfiguration> {
    try {
      const dbSettings = await this.settingsRepo.getAll();
      const settingsMap = new Map<string, string>();
      for (const s of dbSettings) {
        settingsMap.set(s.key, s.value);
      }

      return {
        // Club
        clubName: settingsMap.get("club.name") || DEFAULT_RCMS_CONFIG.clubName,
        collegeName: settingsMap.get("club.college") || DEFAULT_RCMS_CONFIG.collegeName,
        academicYearDisplay: settingsMap.get("club.academic_year") || DEFAULT_RCMS_CONFIG.academicYearDisplay,
        logoUrl: settingsMap.get("club.logo") || DEFAULT_RCMS_CONFIG.logoUrl,
        defaultTimezone: settingsMap.get("club.timezone") || DEFAULT_RCMS_CONFIG.defaultTimezone,
        defaultCurrency: settingsMap.get("club.currency") || DEFAULT_RCMS_CONFIG.defaultCurrency,
        clubDescription: settingsMap.get("club.description") || DEFAULT_RCMS_CONFIG.clubDescription,

        // Attendance
        defaultSessionDuration: Number(settingsMap.get("attendance.session_duration")) || DEFAULT_RCMS_CONFIG.defaultSessionDuration,
        defaultLateThreshold: Number(settingsMap.get("attendance.late_threshold")) || DEFAULT_RCMS_CONFIG.defaultLateThreshold,
        defaultAttendancePoints: Number(settingsMap.get("attendance.points")) || DEFAULT_RCMS_CONFIG.defaultAttendancePoints,
        defaultLateAttendancePoints: Number(settingsMap.get("attendance.late_points")) || DEFAULT_RCMS_CONFIG.defaultLateAttendancePoints,
        defaultVolunteerPinExpiry: Number(settingsMap.get("attendance.pin_expiry")) || DEFAULT_RCMS_CONFIG.defaultVolunteerPinExpiry,

        // Points
        defaultTaskPoints: Number(settingsMap.get("points.task_default")) || DEFAULT_RCMS_CONFIG.defaultTaskPoints,
        defaultAttendanceReward: Number(settingsMap.get("points.attendance_reward")) || DEFAULT_RCMS_CONFIG.defaultAttendanceReward,
        defaultEventReward: Number(settingsMap.get("points.event_reward")) || DEFAULT_RCMS_CONFIG.defaultEventReward,
        defaultVolunteerReward: Number(settingsMap.get("points.volunteer_reward")) || DEFAULT_RCMS_CONFIG.defaultVolunteerReward,
        defaultManualAward: Number(settingsMap.get("points.manual_award")) || DEFAULT_RCMS_CONFIG.defaultManualAward,
        defaultPenalty: Number(settingsMap.get("points.penalty")) || DEFAULT_RCMS_CONFIG.defaultPenalty,

        // Semester
        defaultSemesterLength: Number(settingsMap.get("semester.length_days")) || DEFAULT_RCMS_CONFIG.defaultSemesterLength,
        defaultSemesterNamingPattern: settingsMap.get("semester.naming_pattern") || DEFAULT_RCMS_CONFIG.defaultSemesterNamingPattern,
        membershipRenewalGracePeriod: Number(settingsMap.get("semester.grace_period_days")) || DEFAULT_RCMS_CONFIG.membershipRenewalGracePeriod,
        defaultEnrollmentStatus: settingsMap.get("semester.enrollment_status") || DEFAULT_RCMS_CONFIG.defaultEnrollmentStatus,

        // Operations
        defaultEventDuration: Number(settingsMap.get("operations.event_duration")) || DEFAULT_RCMS_CONFIG.defaultEventDuration,
        defaultTaskStatus: settingsMap.get("operations.task_status") || DEFAULT_RCMS_CONFIG.defaultTaskStatus,
        defaultEventStatus: settingsMap.get("operations.event_status") || DEFAULT_RCMS_CONFIG.defaultEventStatus,
      };
    } catch (error) {
      logger.error("[ConfigurationService] Failed to load configuration, fallback to defaults", error);
      return DEFAULT_RCMS_CONFIG;
    }
  }

  public async updateSettings(
    updates: Record<string, string>,
    actorId?: UUID
  ): Promise<RCMSGlobalConfiguration> {
    logger.info("[ConfigurationService] Updating system configuration keys", { count: Object.keys(updates).length });
    for (const [key, value] of Object.entries(updates)) {
      await this.settingsRepo.upsert(key, String(value), undefined, actorId);
    }
    return this.getFullConfiguration();
  }
}
