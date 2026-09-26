import Link from "next/link";
import { Bot, Shield, UserCheck, Sparkles, Calendar, Trophy, Info, Home } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <Bot className="h-5 w-5" />
              </div>
              <span className="text-base font-bold text-slate-900">
                Robotics Club
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto sm:mx-0 leading-relaxed">
              Student Activity Council (SAC) Robotics Club platform. Empowering students in hardware engineering, embedded systems, autonomous robotics, and AI/ML competitions.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-center sm:text-left">
              Quick Links
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link
                  href="/"
                  className="flex items-center space-x-2 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors min-h-[44px]"
                >
                  <Home className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Home Overview</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="flex items-center space-x-2 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors min-h-[44px]"
                >
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Club Events</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/freshers"
                  className="flex items-center space-x-2 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors min-h-[44px]"
                >
                  <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>Freshers Campaign</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="flex items-center space-x-2 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors min-h-[44px]"
                >
                  <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Public Leaderboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="flex items-center space-x-2 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors min-h-[44px]"
                >
                  <Info className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>About Robotics Club</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* System & Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-center sm:text-left">
              Portal Access
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link
                  href="/volunteer"
                  className="flex items-center space-x-2 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors min-h-[44px]"
                >
                  <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Volunteer Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="flex items-center space-x-2 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors min-h-[44px]"
                >
                  <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Admin Sign In</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Sree Vindyan — Robotics Club. All rights reserved.</p>
          <p className="flex items-center space-x-1">
            <span>Built with precision for Robotics Club Members</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
