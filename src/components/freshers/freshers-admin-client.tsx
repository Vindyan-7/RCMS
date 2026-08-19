"use client";

import { useState } from "react";
import {
  Sparkles,
  Users,
  Star,
  Trophy,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Award,
  Calendar,
  X,
  Play,
  RotateCcw,
  UserPlus,
  RefreshCw,
  Gift,
  Zap,
} from "lucide-react";
import {
  getFreshersAdminDashboardAction,
  updateCampaignStatusAction,
  executeLuckyDrawAction,
  convertCampaignEntryToMemberAction,
} from "@/actions/freshers/freshers_admin.actions";
import { FreshersCampaignSelect, FreshersCampaignEntrySelect } from "@/db/schema";
import { DetailDrawer } from "@/components/ui/detail-drawer";

interface FreshersAdminClientProps {
  initialData: {
    activeCampaign: FreshersCampaignSelect | null;
    stats: {
      totalEntries: number;
      todaysEntries: number;
      avgRating: number;
      eligibleEntries: number;
      winnersSelected: number;
    };
    entries: FreshersCampaignEntrySelect[];
    total: number;
    winners: FreshersCampaignEntrySelect[];
  };
}

export function FreshersAdminClient({ initialData }: FreshersAdminClientProps) {
  const [data, setData] = useState(initialData);

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [drawStatusFilter, setDrawStatusFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FreshersCampaignEntrySelect | null>(null);

  // Lucky Draw State
  const [selectedPrizeTier, setSelectedPrizeTier] = useState("Tier A - Special Membership Reward");
  const [drawingWinner, setDrawingWinner] = useState(false);
  const [revealedWinner, setRevealedWinner] = useState<FreshersCampaignEntrySelect | null>(null);
  const [drawError, setDrawError] = useState("");

  const [convertLoading, setConvertLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await getFreshersAdminDashboardAction({
        search: search || undefined,
        rating: ratingFilter !== "all" ? Number(ratingFilter) : undefined,
        drawStatus: drawStatusFilter !== "all" ? drawStatusFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {}
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: "draft" | "active" | "closed") => {
    if (!data.activeCampaign) return;
    setLoading(true);
    try {
      const res = await updateCampaignStatusAction(data.activeCampaign.id, newStatus);
      if (res.success && res.data) {
        setData((prev) => ({
          ...prev,
          activeCampaign: res.data!,
        }));
        setActionMessage(`Campaign status updated to ${newStatus.toUpperCase()}`);
      }
    } catch {}
    setLoading(false);
  };

  const handleExecuteDraw = async () => {
    setDrawError("");
    setRevealedWinner(null);
    setDrawingWinner(true);

    try {
      const res = await executeLuckyDrawAction(selectedPrizeTier);
      if (res.success && res.data) {
        setRevealedWinner(res.data);
        await refreshData();
      } else {
        setDrawError(res.error?.message || "Failed to execute lucky draw.");
      }
    } catch (err: any) {
      setDrawError(err.message || "An unexpected error occurred during lucky draw execution.");
    } finally {
      setDrawingWinner(false);
    }
  };

  const handleConvertMember = async (entryId: string) => {
    setConvertLoading(true);
    setActionMessage("");
    try {
      const res = await convertCampaignEntryToMemberAction(entryId);
      if (res.success) {
        setActionMessage(res.data?.message || "Successfully converted to official member!");
        await refreshData();
        if (selectedEntry && selectedEntry.id === entryId) {
          setSelectedEntry({ ...selectedEntry, status: "converted" });
        }
      } else {
        setActionMessage(res.error?.message || "Failed to convert entry.");
      }
    } catch (err: any) {
      setActionMessage(err.message || "Conversion failed.");
    } finally {
      setConvertLoading(false);
    }
  };

  const filteredEntries = data.entries.filter((entry) => {
    if (ratingFilter !== "all" && entry.stallRating !== Number(ratingFilter)) {
      return false;
    }
    if (drawStatusFilter !== "all" && entry.drawStatus !== drawStatusFilter) {
      return false;
    }
    if (statusFilter !== "all" && entry.status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const matchName = entry.fullName.toLowerCase().includes(term);
      const matchMobile = entry.mobileNumber.toLowerCase().includes(term);
      if (!matchName && !matchMobile) return false;
    }
    return true;
  });

  const activeCampaign = data.activeCampaign;
  const stats = data.stats;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>RCMS Campaign Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Freshers Campaign Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage fresher registrations, stall ratings, and server-authoritative lucky draw selection.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center space-x-2 rounded-xl bg-card border border-border px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 p-4 text-xs font-semibold text-primary">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage("")} className="text-primary/70 hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Campaign Configuration & Status Control */}
      {activeCampaign && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campaign Key</span>
              <span className="rounded-md bg-accent px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                {activeCampaign.campaignKey}
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground">{activeCampaign.title}</h2>
            <p className="text-xs text-muted-foreground">{activeCampaign.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">Campaign Status:</span>
            <div className="flex items-center rounded-xl bg-muted p-1">
              {(["draft", "active", "closed"] as const).map((st) => {
                const isActive = activeCampaign.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={loading}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all uppercase ${
                      isActive
                        ? st === "active"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : st === "closed"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-amber-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Entries</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{stats.totalEntries}</p>
          <p className="text-[10px] text-muted-foreground">Registered freshers</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Today&apos;s Entries</span>
            <Zap className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{stats.todaysEntries}</p>
          <p className="text-[10px] text-muted-foreground">Scanned today</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Avg Stall Rating</span>
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-500">{stats.avgRating} <span className="text-xs font-semibold text-muted-foreground">/ 5.0</span></p>
          <p className="text-[10px] text-muted-foreground">Fresher satisfaction</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Eligible Entries</span>
            <Award className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{stats.eligibleEntries}</p>
          <p className="text-[10px] text-muted-foreground">Ready for lucky draw</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Winners Selected</span>
            <Trophy className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.winnersSelected}</p>
          <p className="text-[10px] text-muted-foreground">Draw position count</p>
        </div>
      </div>

      {/* LUCKY DRAW CENTER */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Lucky Draw Center</h2>
              <p className="text-xs text-muted-foreground">Server-side randomized winner selection with audit logging</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedPrizeTier}
              onChange={(e) => setSelectedPrizeTier(e.target.value)}
              className="rounded-xl bg-background border border-border px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Tier A - Special Membership Reward">Tier A - Special Membership Reward</option>
              <option value="Tier B - Robotics Hardware Kit">Tier B - Robotics Hardware Kit</option>
              <option value="Tier C - Welcome Surprise Pack">Tier C - Welcome Surprise Pack</option>
            </select>

            <button
              onClick={handleExecuteDraw}
              disabled={drawingWinner || stats.eligibleEntries === 0 || activeCampaign?.status !== "active"}
              className="inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all active:scale-95"
            >
              <Gift className={`h-4 w-4 ${drawingWinner ? "animate-bounce" : ""}`} />
              <span>{drawingWinner ? "Drawing Winner..." : "Draw Winner 🎲"}</span>
            </button>
          </div>
        </div>

        {drawError && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-semibold text-rose-500">
            {drawError}
          </div>
        )}

        {/* Revealed Winner Celebration Banner */}
        {revealedWinner && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-500/30 p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center space-x-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-extrabold text-amber-500 uppercase tracking-wider">
              <Trophy className="h-4 w-4" />
              <span>Winner Announced! Position #{revealedWinner.winnerPosition}</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground">{revealedWinner.fullName}</h3>
              <p className="text-xs font-mono text-muted-foreground">Mobile: {revealedWinner.mobileNumber}</p>
            </div>

            <div className="inline-block rounded-xl bg-background border border-border px-4 py-2 text-xs font-semibold text-primary">
              Prize: <span className="font-bold">{revealedWinner.prizeTier || selectedPrizeTier}</span>
            </div>
          </div>
        )}

        {/* Winner History Table */}
        {data.winners.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Winner Audit Log</h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Pos #</th>
                    <th className="px-4 py-3">Winner Name</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Prize Tier</th>
                    <th className="px-4 py-3">Drawn At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {data.winners.map((w) => (
                    <tr key={w.id} className="hover:bg-accent/50">
                      <td className="px-4 py-3 font-bold text-amber-500">#{w.winnerPosition}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{w.fullName}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{w.mobileNumber}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{w.prizeTier || "Default"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{w.drawnAt ? new Date(w.drawnAt).toLocaleString() : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ENTRIES TABLE & FILTERS */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Campaign Registrations ({filteredEntries.length})</h2>
            <p className="text-xs text-muted-foreground">Filter, inspect, and convert fresher entries</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refreshData()}
                className="rounded-xl bg-background border border-border pl-9 pr-4 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60"
              />
            </div>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="rounded-xl bg-background border border-border px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
              <option value="4">4 Stars ⭐⭐⭐⭐</option>
              <option value="3">3 Stars ⭐⭐⭐</option>
              <option value="2">2 Stars ⭐⭐</option>
              <option value="1">1 Star ⭐</option>
            </select>

            {/* Draw Status Filter */}
            <select
              value={drawStatusFilter}
              onChange={(e) => setDrawStatusFilter(e.target.value)}
              className="rounded-xl bg-background border border-border px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Draw Statuses</option>
              <option value="eligible">Eligible</option>
              <option value="winner">Winner</option>
              <option value="excluded">Excluded</option>
            </select>

            <button
              onClick={refreshData}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Entries Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Stall Rating</th>
                <th className="px-4 py-3">Feedback</th>
                <th className="px-4 py-3">Entry Date</th>
                <th className="px-4 py-3">Draw Status</th>
                <th className="px-4 py-3">Entry Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No fresher campaign entries found matching filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-foreground">{entry.fullName}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{entry.mobileNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1 font-bold text-amber-500">
                        <span>{entry.stallRating}</span>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {entry.feedback || <span className="text-muted-foreground/50 italic">None</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          entry.drawStatus === "winner"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : entry.drawStatus === "eligible"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {entry.drawStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          entry.status === "converted"
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(entry);
                        }}
                        className="rounded-lg bg-accent border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-accent/80"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RCMS SLIDE-OVER WORKSPACE DRAWER */}
      <DetailDrawer
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title="Entry Workspace"
        maxWidth="max-w-md"
        className="p-6"
      >
        {selectedEntry && (
          <>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                    <Users className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Entry Workspace</h3>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Entry Details */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</p>
                  <p className="text-lg font-extrabold text-foreground">{selectedEntry.fullName}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mobile Number</p>
                  <p className="text-sm font-mono font-bold text-foreground">{selectedEntry.mobileNumber}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stall Rating</p>
                  <div className="flex items-center space-x-1 font-bold text-amber-500 text-sm">
                    <span>{selectedEntry.stallRating} Stars</span>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s <= selectedEntry.stallRating ? "fill-amber-400" : "text-slate-600"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stall Feedback</p>
                  <div className="rounded-xl bg-muted p-3 text-xs text-foreground leading-relaxed">
                    {selectedEntry.feedback || "No feedback comments provided."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl bg-muted p-3 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Draw Status</p>
                    <p className="text-xs font-bold text-foreground uppercase">{selectedEntry.drawStatus}</p>
                  </div>
                  <div className="rounded-xl bg-muted p-3 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Entry Status</p>
                    <p className="text-xs font-bold text-foreground uppercase">{selectedEntry.status}</p>
                  </div>
                </div>

                {selectedEntry.drawStatus === "winner" && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Winner Position #{selectedEntry.winnerPosition}</p>
                    <p className="text-xs font-bold text-foreground">Prize: {selectedEntry.prizeTier || "Default"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-border space-y-3">
              {selectedEntry.status !== "converted" ? (
                <button
                  onClick={() => handleConvertMember(selectedEntry.id)}
                  disabled={convertLoading}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{convertLoading ? "Converting..." : "Convert to Official Member"}</span>
                </button>
              ) : (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center text-xs font-bold text-emerald-500 flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Official Member Converted</span>
                </div>
              )}
            </div>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}
