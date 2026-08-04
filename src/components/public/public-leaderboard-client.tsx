"use client";

import { useState } from "react";
import { PublicLeaderboardItem } from "@/actions/public/public_leaderboard.actions";
import { Trophy, Search, Filter, Award, CheckCircle2, Calendar, ShieldAlert } from "lucide-react";

interface PublicLeaderboardClientProps {
  initialLeaderboard: PublicLeaderboardItem[];
}

export function PublicLeaderboardClient({ initialLeaderboard }: PublicLeaderboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  const filteredItems = initialLeaderboard.filter((item) => {
    const matchesSearch =
      item.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.membershipId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch =
      branchFilter === "all" || item.branch.toLowerCase() === branchFilter.toLowerCase();

    return matchesSearch && matchesBranch;
  });

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
    if (rank === 2) return "bg-slate-200 text-slate-800 border-slate-300 font-bold";
    if (rank === 3) return "bg-amber-700/10 text-amber-900 border-amber-700/30 font-bold";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getBadgeTierStyle = (tier: string) => {
    switch (tier) {
      case "Gold Vanguard":
        return "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-xs font-semibold";
      case "Silver Contributor":
        return "bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-xs font-semibold";
      case "Bronze Member":
        return "bg-gradient-to-r from-amber-700 to-amber-900 text-white shadow-xs font-semibold";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search member name or ID (e.g. SAC-RC-26002)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Branches</option>
            <option value="ECE">ECE</option>
            <option value="CSE">CSE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="AI/ML">AI/ML</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table / Card List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Membership ID</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4 text-center">Tasks Completed</th>
                <th className="py-3.5 px-4 text-center">Attendance %</th>
                <th className="py-3.5 px-4 text-right">Semester Points</th>
                <th className="py-3.5 px-4 text-center">Badge Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No members match your criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.membershipId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${getRankBadgeClass(item.rank)}`}>
                        {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `#${item.rank}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.memberName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {item.membershipId}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                        {item.branch}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      <span className="inline-flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{item.tasksCompleted}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-700">{item.attendanceRate}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-blue-600 text-sm">
                      {item.totalPoints} Pts
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] ${getBadgeTierStyle(item.badgeTier)}`}>
                        <Award className="h-3 w-3" />
                        <span>{item.badgeTier}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Card List View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No members match your criteria.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.membershipId} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs ${getRankBadgeClass(item.rank)}`}>
                      {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `#${item.rank}`}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.memberName}</h4>
                      <p className="text-[11px] font-mono text-slate-500">{item.membershipId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-blue-600">{item.totalPoints} Pts</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-[11px] border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Branch</span>
                    <span className="font-semibold text-slate-700">{item.branch}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400 block text-[10px]">Tasks</span>
                    <span className="font-semibold text-slate-700">{item.tasksCompleted}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Attendance</span>
                    <span className="font-semibold text-slate-700">{item.attendanceRate}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] ${getBadgeTierStyle(item.badgeTier)}`}>
                    <Award className="h-3 w-3" />
                    <span>{item.badgeTier}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 italic">Robotics Club Contributor</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
