import Link from "next/link";
import { Bot, Shield, UserCheck, Heart } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <span className="text-base font-bold text-slate-900">
                SAC Robotics Club
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Student Activity Center (SAC) Robotics Club platform. Empowering students in hardware engineering, embedded systems, autonomous robotics, and AI/ML competitions.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/" className="hover:text-slate-900 transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-slate-900 transition-colors">
                  Public Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-slate-900 transition-colors">
                  About Robotics Club
                </Link>
              </li>
            </ul>
          </div>

          {/* System & Portals */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Portal Access
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/volunteer"
                  className="inline-flex items-center space-x-1.5 text-slate-500 hover:text-slate-900 transition-colors group"
                >
                  <UserCheck className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700" />
                  <span>Volunteer Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-slate-700 transition-colors group"
                >
                  <Shield className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600" />
                  <span>Admin Sign In</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} SAC Robotics Club System (RCMS). All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Built with precision for Robotics Club Members</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
