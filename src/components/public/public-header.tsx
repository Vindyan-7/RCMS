"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Trophy,
  Info,
  Home,
  Sparkles,
  Calendar,
  Menu,
  X,
  UserCheck,
  Shield,
  ArrowRight,
} from "lucide-react";

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Club Events", href: "/events", icon: Calendar },
    { name: "Freshers", href: "/freshers", icon: Sparkles },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "About", href: "/about", icon: Info },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md transition-transform group-hover:scale-105">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="truncate">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Robotics Club
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2" aria-label="Desktop Navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown / Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-slate-950/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full bg-white border-b border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[calc(100dvh-4rem)] overflow-y-auto animate-in slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1.5" aria-label="Mobile Navigation">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all min-h-[48px] ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-500"}`} />
                      <span>{link.name}</span>
                    </div>
                    {isActive ? (
                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Portals in Mobile Menu */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Portals & Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/volunteer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[44px]"
                >
                  <UserCheck className="h-4 w-4 text-slate-500" />
                  <span>Volunteer</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[44px]"
                >
                  <Shield className="h-4 w-4 text-slate-500" />
                  <span>Admin</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
