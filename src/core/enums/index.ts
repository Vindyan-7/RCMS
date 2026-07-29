/**
 * RCMS Reusable Enums
 */

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  VOLUNTEER = "volunteer",
}

export enum MembershipStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ALUMNI = "alumni",
  SUSPENDED = "suspended",
}

export enum AttendanceStatus {
  PRESENT = "present",
  LATE = "late",
  ABSENT = "absent",
}

export enum AttendanceSessionStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  ACTIVE = "active",
  PAUSED = "paused",
  CLOSED = "closed",
  ARCHIVED = "archived",
}

export enum EventStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  ARCHIVED = "archived",
}

export enum TaskStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export enum InventoryStatus {
  AVAILABLE = "available",
  BORROWED = "borrowed",
  OVERDUE = "overdue",
  DAMAGED = "damaged",
  LOST = "lost",
}

export enum BorrowingStatus {
  BORROWED = "borrowed",
  RETURNED = "returned",
  OVERDUE = "overdue",
}

export enum NotificationType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

export enum PointsCategory {
  ATTENDANCE = "attendance",
  TASK = "task",
  EVENT = "event",
  BONUS = "bonus",
  ADJUSTMENT = "adjustment",
}
