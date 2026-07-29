"use client";

import { useRouter } from "next/navigation";
import { User, LogOut, Bell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();

  const handleLogout = () => {
    // Session logout state clear
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-md">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Active Session:</span>
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-500 font-medium">
            <ShieldCheck className="mr-1 h-3 w-3" /> Super Admin
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
          </span>
        </Button>

        <div className="flex items-center space-x-3 border-l border-border pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            <User className="h-5 w-5" />
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
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
