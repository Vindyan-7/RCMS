"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Bell,
  ShieldCheck,
  Menu,
  X,
  LayoutDashboard,
  Users,
  CalendarCheck,
  CheckSquare,
  Award,
  Box,
  DollarSign,
  BarChart3,
  Settings,
  GraduationCap,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    document.cookie = "rcms_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/50 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          {/* Mobile Hamburger Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline font-semibold text-foreground">Active Session:</span>
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-500 font-medium text-[11px] sm:text-xs">
              <ShieldCheck className="mr-1 h-3 w-3" /> Super Admin
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
            </span>
          </Button>

          <div className="flex items-center space-x-2 sm:space-x-3 border-l border-border pl-3 sm:pl-4">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-foreground">Admin Officer</p>
              <p className="text-[10px] text-muted-foreground">admin@robotics.org</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Log out"
              className="text-muted-foreground hover:text-destructive h-8 w-8 sm:h-9 sm:w-9"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-background/95 backdrop-blur-lg p-6 flex flex-col space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">RCMS Core</h2>
                <p className="text-xs text-muted-foreground">Robotics Club System</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>

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
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-md"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
