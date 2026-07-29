/**
 * Reusable System Permissions Constants
 */

export const PERMISSIONS = {
  // Members Module Permissions
  MEMBERS_CREATE: "members.create",
  MEMBERS_VIEW: "members.view",
  MEMBERS_EDIT: "members.edit",
  MEMBERS_DELETE: "members.delete",
  MEMBERS_IMPORT: "members.import",
  
  // Attendance Engine Permissions
  ATTENDANCE_CREATE: "attendance.create",
  ATTENDANCE_VIEW: "attendance.view",
  ATTENDANCE_EDIT: "attendance.edit",
  ATTENDANCE_MARK: "attendance.mark",
  
  // Activities Module (Tasks & Events) Permissions
  ACTIVITIES_CREATE: "activities.create",
  ACTIVITIES_VIEW: "activities.view",
  ACTIVITIES_EDIT: "activities.edit",
  ACTIVITIES_COMPLETE: "activities.complete",
  
  // Inventory Module Permissions
  INVENTORY_CREATE: "inventory.create",
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_EDIT: "inventory.edit",
  INVENTORY_ISSUE: "inventory.issue",
  INVENTORY_RETURN: "inventory.return",
  
  // Administration Settings & Auditing Permissions
  SETTINGS_VIEW: "settings.view",
  SETTINGS_EDIT: "settings.edit",
  
  AUDIT_VIEW: "audit.view",
  
  // Financial Permissions (Future Expansion)
  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE: "finance.manage",
} as const;

export type SystemPermission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
