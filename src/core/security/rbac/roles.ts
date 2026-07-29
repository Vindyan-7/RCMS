/**
 * Reusable System Roles Constants
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  FACULTY_ADVISOR: "faculty_advisor",
  CLUB_PRESIDENT: "club_president",
  VICE_PRESIDENT: "vice_president",
  SECRETARY: "secretary",
  TREASURER: "treasurer",
  EVENT_COORDINATOR: "event_coordinator",
  INVENTORY_MANAGER: "inventory_manager",
  MENTOR: "mentor",
  VOLUNTEER: "volunteer",
  MEMBER: "member",
  GUEST: "guest",
} as const;

export type SystemRole = typeof ROLES[keyof typeof ROLES];
