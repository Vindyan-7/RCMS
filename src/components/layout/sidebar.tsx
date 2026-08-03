"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Bot,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Semesters", href: "/dashboard/semesters", icon: GraduationCap },
  { name: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
  { name: "Operations", href: "/dashboard/operations", icon: CheckSquare },
  { name: "Points Engine", href: "/dashboard/points", icon: Award },
  { name: "Communication", href: "/dashboard/communication", icon: Bell },
  { name: "Inventory", href: "/dashboard/inventory", icon: Box },
  { name: "Finance", href: "/dashboard/finance", icon: DollarSign },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card/80 backdrop-blur-md transition-transform flex-col">
      <div className="flex h-full flex-col justify-between px-4 py-6">
        <div className="space-y-6">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                RCMS Core
              </h1>
              <p className="text-xs font-medium text-muted-foreground">
                Robotics Club System
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-accent-foreground"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="px-2 font-mono">RCMS v1.0 Release Candidate</div>
          <div className="px-2 text-[10px] text-muted-foreground/70">
            Powered by Supabase & Drizzle
          </div>
        </div>
      </div>
    </aside>
  );
}
