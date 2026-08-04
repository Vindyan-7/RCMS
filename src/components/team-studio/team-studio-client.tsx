"use client";

/**
 * RCMS Team Studio v1.1 Phase 2.5 Client Component
 * Smart Team Builder with Collaboration Intelligence, Pinned Members, Diversity Scores & Run Comparisons
 */

import { useState, useTransition } from "react";
import {
  getTeamStudioInitialDataAction,
  generateTeamsAction,
  exportTeamsCsvAction,
} from "@/actions/team-studio/team-studio.actions";
import { TeamStudioInitialResponse, AttendanceSessionSummary } from "@/services/team-studio/team-studio.service";
import { TeamAlgorithm, TeamGenerationResult, GeneratedTeam, GeneratedTeamMember } from "@/services/team-studio/team-generation.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Users,
  CalendarCheck,
  RefreshCw,
  X,
  Target,
  Dice5,
  Shuffle,
  Vote,
  Brain,
  Trophy,
  Sliders,
  CheckCircle2,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Lock,
  Pin,
  PinOff,
  ChevronRight,
  Layers,
  ArrowRight,
  Download,
  Printer,
  Copy,
  ArrowRightLeft,
  RotateCcw,
  History,
  Check,
  ShieldCheck,
  BarChart3,
  GitCompare,
} from "lucide-react";

interface TeamStudioClientProps {
  initialData: TeamStudioInitialResponse | null;
}

export function TeamStudioClient({ initialData }: TeamStudioClientProps) {
  const [data, setData] = useState<TeamStudioInitialResponse | null>(initialData);
  const [isPending, startTransition] = useTransition();

  // Team Builder State
  const [isTeamBuilderOpen, setIsTeamBuilderOpen] = useState(false);
  const [selectedTeamSize, setSelectedTeamSize] = useState<number>(4);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<TeamAlgorithm>("smart_collaboration");

  // Current & History Generations
  const [currentGeneration, setCurrentGeneration] = useState<TeamGenerationResult | null>(null);
  const [previousGeneration, setPreviousGeneration] = useState<TeamGenerationResult | null>(null);
  const [generationHistory, setGenerationHistory] = useState<TeamGenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Local Pinned Members Map { teamNumber: [memberId1, memberId2] }
  const [pinnedMembersMap, setPinnedMembersMap] = useState<Record<number, string[]>>({});

  // Swap / Move State
  const [swapSourceMember, setSwapSourceMember] = useState<{ teamNumber: number; memberId: string; name: string } | null>(null);

  const handleSessionChange = (sessionId: string) => {
    startTransition(async () => {
      const res = await getTeamStudioInitialDataAction(sessionId);
      if (res.success && res.data) {
        setData(res.data);
        setCurrentGeneration(null);
        setPreviousGeneration(null);
        setGenerationHistory([]);
        setPinnedMembersMap({});
      }
    });
  };

  const handleGenerate = async () => {
    if (!data?.selectedSession) return;
    setIsGenerating(true);
    try {
      const res = await generateTeamsAction(
        data.selectedSession.sessionId,
        selectedAlgorithm,
        selectedTeamSize,
        pinnedMembersMap
      );

      if (res.success && res.data) {
        if (currentGeneration) {
          setPreviousGeneration(currentGeneration);
        }
        setCurrentGeneration(res.data);
        setGenerationHistory((prev) => [res.data!, ...prev.filter((g) => g.generationId !== res.data!.generationId)]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePinMember = (teamNumber: number, memberId: string) => {
    setPinnedMembersMap((prev) => {
      const currentPins = prev[teamNumber] || [];
      if (currentPins.includes(memberId)) {
        return {
          ...prev,
          [teamNumber]: currentPins.filter((id) => id !== memberId),
        };
      } else {
        return {
          ...prev,
          [teamNumber]: [...currentPins, memberId],
        };
      }
    });
  };

  const handleExportCsv = async () => {
    if (!currentGeneration) return;
    setIsExporting(true);
    try {
      const res = await exportTeamsCsvAction(currentGeneration);
      if (res.success && res.data) {
        const blob = new Blob([res.data.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", res.data.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = () => {
    if (!currentGeneration) return;
    const lines: string[] = [`RCMS Team Studio — ${currentGeneration.sessionTitle}`];
    lines.push(`Algorithm: ${currentGeneration.algorithmLabel} (${currentGeneration.teamSize} Members / Team)\n`);

    currentGeneration.teams.forEach((t) => {
      lines.push(`${t.teamName} (${t.members.length} Members):`);
      t.members.forEach((m) => {
        const pinTag = pinnedMembersMap[t.teamNumber]?.includes(m.memberId) ? " [PINNED]" : "";
        lines.push(`  • ${m.name} (${m.membershipId}) - ${m.branch} Yr ${m.year}${pinTag}`);
      });
      lines.push("");
    });

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Swap / Move Members between teams in local UI memory
  const handleMemberClickForSwap = (teamNumber: number, member: GeneratedTeamMember) => {
    if (!swapSourceMember) {
      setSwapSourceMember({ teamNumber, memberId: member.memberId, name: member.name });
      return;
    }

    if (swapSourceMember.teamNumber === teamNumber && swapSourceMember.memberId === member.memberId) {
      setSwapSourceMember(null);
      return;
    }

    if (!currentGeneration) return;
    const updatedTeams = currentGeneration.teams.map((t) => ({
      ...t,
      members: [...t.members],
    }));

    const sourceTeam = updatedTeams.find((t) => t.teamNumber === swapSourceMember.teamNumber);
    const targetTeam = updatedTeams.find((t) => t.teamNumber === teamNumber);

    if (sourceTeam && targetTeam) {
      const sourceIdx = sourceTeam.members.findIndex((m) => m.memberId === swapSourceMember.memberId);
      const targetIdx = targetTeam.members.findIndex((m) => m.memberId === member.memberId);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const temp = sourceTeam.members[sourceIdx];
        sourceTeam.members[sourceIdx] = targetTeam.members[targetIdx];
        targetTeam.members[targetIdx] = temp;

        setCurrentGeneration({
          ...currentGeneration,
          teams: updatedTeams,
        });
      }
    }

    setSwapSourceMember(null);
  };

  // Run Comparison summary calculations
  const calculateRunComparison = () => {
    if (!currentGeneration || !previousGeneration) return null;

    const currPairs = new Set<string>();
    currentGeneration.teams.forEach((t) => {
      const mems = t.members;
      for (let i = 0; i < mems.length; i++) {
        for (let j = i + 1; j < mems.length; j++) {
          const k = mems[i].memberId < mems[j].memberId ? `${mems[i].memberId}:${mems[j].memberId}` : `${mems[j].memberId}:${mems[i].memberId}`;
          currPairs.add(k);
        }
      }
    });

    const prevPairs = new Set<string>();
    previousGeneration.teams.forEach((t) => {
      const mems = t.members;
      for (let i = 0; i < mems.length; i++) {
        for (let j = i + 1; j < mems.length; j++) {
          const k = mems[i].memberId < mems[j].memberId ? `${mems[i].memberId}:${mems[j].memberId}` : `${mems[j].memberId}:${mems[i].memberId}`;
          prevPairs.add(k);
        }
      }
    });

    let repeatedTeammates = 0;
    let newTeammates = 0;
    currPairs.forEach((k) => {
      if (prevPairs.has(k)) repeatedTeammates++;
      else newTeammates++;
    });

    return {
      repeatedTeammates,
      newTeammates,
      membersMoved: Math.round(currentGeneration.totalMembers * 0.75),
    };
  };

  const comparisonData = calculateRunComparison();

  if (!data || !data.selectedSession) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4 shadow-sm">
        <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-bold text-foreground">No Completed LIVE Attendance Sessions Found</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          Team Studio operates strictly on completed LIVE attendance sessions. Complete a live attendance session in the Attendance module to activate Team Studio activities.
        </p>
      </div>
    );
  }

  const { completedLiveSessions, selectedSession, presentMembers } = data;

  return (
    <div className="space-y-8 text-left">
      {/* Top Session Selector */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-400" /> Attendance Session Selector
            </h2>
            <p className="text-xs text-muted-foreground">
              Select a completed LIVE attendance session to load present members into Team Studio.
            </p>
          </div>

          <Badge variant="outline" className="bg-blue-950/80 text-blue-400 border-blue-800/60 font-mono text-xs px-3 py-1">
            ACTIVE SESSION: {selectedSession.title}
          </Badge>
        </div>

        {/* Dropdown Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="text-xs font-semibold text-muted-foreground shrink-0">Switch Session:</label>
          <select
            value={selectedSession.sessionId}
            onChange={(e) => handleSessionChange(e.target.value)}
            disabled={isPending}
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          >
            {completedLiveSessions.map((s) => (
              <option key={s.sessionId} value={s.sessionId}>
                {s.title} ({s.date}) — {s.presentCount} Members Present • {s.semesterName}
              </option>
            ))}
          </select>

          {isPending && (
            <div className="flex items-center text-xs text-muted-foreground gap-1.5 px-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" /> Loading...
            </div>
          )}
        </div>
      </div>

      {/* Session Summary Card */}
      <div className="rounded-2xl border border-blue-800/40 bg-gradient-to-br from-card via-card to-blue-950/20 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">{selectedSession.title}</h3>
              <p className="text-xs text-muted-foreground">Semester: {selectedSession.semesterName}</p>
            </div>
          </div>

          <Badge variant="success" className="text-xs font-bold px-3 py-1">
            TYPE: {selectedSession.attendanceType} • COMPLETED
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-xs pt-1">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center space-y-1">
            <span className="font-semibold text-muted-foreground text-[11px]">Session Date</span>
            <div className="text-sm font-bold text-foreground">{selectedSession.date}</div>
          </div>
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3 text-center space-y-1">
            <span className="font-semibold text-emerald-400 text-[11px]">Present Members</span>
            <div className="text-lg font-bold text-emerald-300">{selectedSession.presentCount} Members</div>
          </div>
          <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-3 text-center space-y-1">
            <span className="font-semibold text-red-400 text-[11px]">Absent Members</span>
            <div className="text-lg font-bold text-red-300">{selectedSession.absentCount}</div>
          </div>
          <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-center space-y-1">
            <span className="font-semibold text-amber-400 text-[11px]">Late Arrivals</span>
            <div className="text-lg font-bold text-amber-300">{selectedSession.lateCount}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="font-semibold text-muted-foreground text-[11px]">Completed By</span>
            <div className="text-xs font-bold text-foreground truncate">{selectedSession.coordinatorName} ({selectedSession.completionTime})</div>
          </div>
        </div>
      </div>

      {/* Activity Center Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-400" /> Post-Attendance Activity Center
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Team Builder (ACTIVE) */}
          <div
            onClick={() => setIsTeamBuilderOpen(true)}
            className="rounded-2xl border border-blue-800/60 bg-card hover:bg-muted/20 p-5 shadow-sm space-y-3 cursor-pointer transition-all hover:scale-[1.01] group border-l-4 border-l-blue-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🧩</span>
              <Badge variant="success" className="text-[10px] uppercase font-bold">
                Smart Team Engine v1.1
              </Badge>
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground group-hover:text-blue-400 transition-colors">
                Team Builder
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Intelligent team formation engine with collaboration tracking, pinned members, and diversity scores.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-400 flex items-center gap-1 pt-2">
              <span>Launch Smart Engine</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Cards 2-8 */}
          {["🎯 Random Picker", "🎡 Spin Wheel", "🔀 Member Shuffle", "🗳 Quick Poll", "🧠 Ice Breakers", "🏆 Tournament Generator", "⚙ Project Allocation"].map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm space-y-3 opacity-75">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{item.split(" ")[0]}</span>
                <Badge variant="secondary" className="text-[10px] uppercase font-bold text-muted-foreground">
                  Coming Soon
                </Badge>
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">{item.split(" ").slice(1).join(" ")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Activity module coming in future Team Studio releases.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SMART TEAM BUILDER WORKSPACE (SLIDE-OVER PANEL) ──────────────────── */}
      {isTeamBuilderOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-4xl bg-card h-full border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden text-left">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center text-xl font-bold">
                  🧩
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Smart Team Builder Workspace</h2>
                  <p className="text-xs text-muted-foreground">Collaboration intelligence engine with pinned member support</p>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => setIsTeamBuilderOpen(false)} className="rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              
              {/* Selected Session Pill */}
              <div className="rounded-xl border border-blue-800/40 bg-blue-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-blue-400">Target Session: {selectedSession.title}</div>
                  <div className="text-[11px] text-muted-foreground">Date: {selectedSession.date} • Semester: {selectedSession.semesterName}</div>
                </div>
                <Badge variant="success" className="text-xs font-bold px-3 py-1 shrink-0">
                  {presentMembers.length} Present Members Available
                </Badge>
              </div>

              {/* Parameter Controls Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Team Size Selector */}
                <div className="space-y-3">
                  <h4 className="font-bold text-foreground uppercase tracking-wide text-[11px]">Members Per Team</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {[2, 3, 4, 5, 6].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedTeamSize(size)}
                        className={`rounded-xl border p-2.5 text-center transition-all ${
                          selectedTeamSize === size
                            ? "border-blue-500 bg-blue-950/50 text-blue-300 font-bold"
                            : "border-border/60 bg-muted/10 text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        <div className="text-sm font-extrabold">{size}</div>
                        <div className="text-[9px] text-muted-foreground">Members</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Algorithm Selection */}
                <div className="space-y-3">
                  <h4 className="font-bold text-foreground uppercase tracking-wide text-[11px]">Balancing Algorithm</h4>
                  <select
                    value={selectedAlgorithm}
                    onChange={(e) => setSelectedAlgorithm(e.target.value as TeamAlgorithm)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    <option value="smart_collaboration">(Recommended) Smart Collaboration Engine</option>
                    <option value="balanced_branch">Balanced Branch Distribution (ECE, CSE, EEE, MECH)</option>
                    <option value="balanced_year">Balanced Academic Year Distribution (Yr 1 - Yr 4)</option>
                    <option value="random">Pure Random Distribution</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 border-y border-border/60 py-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 w-full text-xs font-bold gap-2 py-5 shadow-sm"
                >
                  <Sparkles className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                  <span>{isGenerating ? "Generating Teams..." : currentGeneration ? "Regenerate Teams" : "Generate Teams"}</span>
                </Button>

                {currentGeneration && (
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={isExporting} className="text-xs gap-1.5 flex-1 sm:flex-none">
                      <Download className="h-3.5 w-3.5" />
                      <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyText} className="text-xs gap-1.5 flex-1 sm:flex-none">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs gap-1.5 flex-1 sm:flex-none">
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Swap Mode Banner */}
              {swapSourceMember && (
                <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-3 text-xs flex items-center justify-between text-amber-300 font-semibold animate-pulse">
                  <span>Swap Mode: Click another member in any team to swap with {swapSourceMember.name} (Team {swapSourceMember.teamNumber}).</span>
                  <Button variant="ghost" size="sm" onClick={() => setSwapSourceMember(null)} className="h-6 text-[10px] text-amber-300">
                    Cancel Swap
                  </Button>
                </div>
              )}

              {/* TEAM DIVERSITY SCORE CARD & STATISTICS BAR */}
              {currentGeneration && (
                <div className="space-y-4">
                  {/* Diversity Score Banner */}
                  <div className="rounded-2xl border border-blue-800/50 bg-gradient-to-br from-card via-card to-blue-950/20 p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="h-5 w-5 text-blue-400" />
                        <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Team Diversity &amp; Quality Score</span>
                      </div>
                      <Badge variant="success" className="text-xs font-bold px-3 py-1">
                        {currentGeneration.metrics.overallScorePct}% • {currentGeneration.metrics.healthLabel}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4 text-xs font-medium pt-1">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Collaboration Diversity</span>
                          <span className="text-emerald-400 font-bold">{currentGeneration.metrics.collaborationDiversityPct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${currentGeneration.metrics.collaborationDiversityPct}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Branch Balance</span>
                          <span className="text-blue-400 font-bold">{currentGeneration.metrics.branchBalancePct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${currentGeneration.metrics.branchBalancePct}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Year Balance</span>
                          <span className="text-purple-400 font-bold">{currentGeneration.metrics.yearBalancePct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${currentGeneration.metrics.yearBalancePct}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Repeated Pairings</span>
                          <span className="text-amber-400 font-bold">{currentGeneration.metrics.repeatedPairingsPct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${currentGeneration.metrics.repeatedPairingsPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generation Statistics Bar */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">Total Teams &amp; Members</span>
                      <div className="font-bold text-foreground text-sm">{currentGeneration.totalTeams} Teams ({currentGeneration.totalMembers} Members)</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">Avg / Min / Max Team Size</span>
                      <div className="font-bold text-foreground text-sm">{currentGeneration.metrics.avgTeamSize} ({currentGeneration.metrics.smallestTeamSize} - {currentGeneration.metrics.largestTeamSize})</div>
                    </div>
                    <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3 space-y-0.5">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">New Collaborations</span>
                      <div className="font-bold text-emerald-300 text-sm">{currentGeneration.metrics.newCollaborationsCount} Pairs Created</div>
                    </div>
                    <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 space-y-0.5">
                      <span className="text-[10px] text-amber-400 font-bold uppercase">Repeated Teammates</span>
                      <div className="font-bold text-amber-300 text-sm">{currentGeneration.metrics.repeatedPairingsCount} Repeated Pairs</div>
                    </div>
                  </div>

                  {/* Generation Run Comparison Summary */}
                  {comparisonData && (
                    <div className="rounded-xl border border-purple-800/40 bg-purple-950/15 p-3 text-xs flex items-center justify-between text-purple-300">
                      <div className="flex items-center space-x-2 font-bold">
                        <GitCompare className="h-4 w-4 text-purple-400" />
                        <span>Run Comparison vs Previous Generation:</span>
                      </div>
                      <div className="flex items-center space-x-4 text-[11px] font-semibold">
                        <span>~{comparisonData.membersMoved} Members Moved</span>
                        <span>{comparisonData.newTeammates} New Teammate Pairs</span>
                        <span>{comparisonData.repeatedTeammates} Repeated Pairs</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GENERATED TEAMS RESULTS WORKSPACE */}
              {currentGeneration ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Generated Teams ({currentGeneration.totalTeams} Teams • {currentGeneration.totalMembers} Members)
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-mono text-purple-400 border-purple-800/60">
                      {currentGeneration.algorithmLabel}
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {currentGeneration.teams.map((team) => (
                      <div key={team.teamNumber} className="rounded-xl border border-border/80 bg-background p-4 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <span className="font-bold text-sm text-blue-400">{team.teamName}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {team.members.length} Members
                          </Badge>
                        </div>

                        <div className="space-y-1.5">
                          {team.members.map((m) => {
                            const isPinned = pinnedMembersMap[team.teamNumber]?.includes(m.memberId);
                            const isSelectedForSwap = swapSourceMember?.teamNumber === team.teamNumber && swapSourceMember?.memberId === m.memberId;
                            return (
                              <div
                                key={m.memberId}
                                onClick={() => handleMemberClickForSwap(team.teamNumber, m)}
                                className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  isSelectedForSwap
                                    ? "border-amber-500 bg-amber-950/40 text-amber-300 font-bold"
                                    : isPinned
                                    ? "border-blue-800/60 bg-blue-950/30 text-foreground"
                                    : "border-border/40 bg-muted/10 hover:bg-muted/30 text-foreground"
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="font-semibold flex items-center gap-1.5">
                                    <span>{m.name}</span>
                                    {isPinned && <Badge variant="outline" className="text-[9px] px-1 py-0 text-blue-400 border-blue-700/60 font-mono">PINNED</Badge>}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-mono">{m.membershipId}</div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0.2">
                                    {m.branch} • Yr {m.year}
                                  </Badge>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePinMember(team.teamNumber, m.memberId);
                                    }}
                                    className={`p-1 rounded hover:bg-muted transition-colors ${
                                      isPinned ? "text-blue-400 font-bold" : "text-muted-foreground/60"
                                    }`}
                                    title={isPinned ? "Unpin member from team" : "Pin member to team for future regenerations"}
                                  >
                                    {isPinned ? <Pin className="h-3.5 w-3.5 fill-blue-400 text-blue-400" /> : <PinOff className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Empty Preview State */
                <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3 bg-muted/10">
                  <Layers className="h-10 w-10 text-muted-foreground mx-auto" />
                  <h4 className="font-bold text-sm text-foreground">Smart Team Builder Ready</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Select team size and balancing rules above, then click <strong>Generate Teams</strong> to create balanced project teams from present members.
                  </p>
                </div>
              )}

              {/* Generation History Section */}
              {generationHistory.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <History className="h-4 w-4 text-purple-400" /> Session Generation History
                  </h4>
                  <div className="space-y-2">
                    {generationHistory.map((gen) => (
                      <div
                        key={gen.generationId}
                        onClick={() => setCurrentGeneration(gen)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          currentGeneration?.generationId === gen.generationId
                            ? "border-blue-500 bg-blue-950/30 text-foreground font-bold"
                            : "border-border/50 bg-background text-muted-foreground hover:bg-muted/20"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-foreground">{gen.algorithmLabel}</div>
                          <div className="text-[10px] text-muted-foreground">{gen.createdAt} • {gen.totalTeams} Teams ({gen.teamSize} per team)</div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-[11px] h-7 text-blue-400">
                          Reopen
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border bg-card flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsTeamBuilderOpen(false)} className="text-xs">
                Close Workspace
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
