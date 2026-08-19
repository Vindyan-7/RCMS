/**
 * Central Navigation Configuration for RCMS Admin Dashboard
 * Single source of truth for both Desktop Sidebar and Mobile Header Drawer.
 */

import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CheckSquare,
  Award,
  Bell,
  Box,
  DollarSign,
  BarChart3,
  Settings,
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
  Gift,
  LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  permission?: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Semesters", href: "/dashboard/semesters", icon: GraduationCap },
  { name: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
  { name: "Operations", href: "/dashboard/operations", icon: CheckSquare },
  { name: "Points Engine", href: "/dashboard/points", icon: Award },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Finance", href: "/dashboard/finance", icon: DollarSign },
  { name: "Inventory", href: "/dashboard/inventory", icon: Box },
  { name: "Communication", href: "/dashboard/communication", icon: Bell },
  { name: "Team Studio", href: "/dashboard/team-studio", icon: Sparkles },
  { name: "Freshers Campaign", href: "/dashboard/freshers", icon: Gift },
  { name: "Reports Center", href: "/dashboard/reports", icon: FileSpreadsheet },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];
