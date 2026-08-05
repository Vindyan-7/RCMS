"use client";

/**
 * RCMS Team Studio v1.1 CTO Polished Edition
 * Includes Saved Presets, Undo Actions, Session Notes, Activity Timeline Log, and Favorite Star Shortcuts
 */

import { useState, useTransition, useMemo } from "react";
import { RCMS_BRANCHES } from "@/constants/branches";
import {
  getTeamStudioInitialDataAction,
  generateTeamsAction,
  exportTeamsCsvAction,
} from "@/actions/team-studio/team-studio.actions";
import { TeamStudioInitialResponse, AttendanceSessionSummary, PresentMemberItem } from "@/services/team-studio/team-studio.service";
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
  Search,
  Filter,
  CheckSquare,
  Square,
  Wand2,
  Play,
  RotateCw,
  Undo2,
  Star,
  FileText,
  Bookmark,
  Plus,
  Save,
} from "lucide-react";

interface PresetItem {
  id: string;
  name: string;
  teamSize: number;
  algorithm: TeamAlgorithm;
}

interface ActivityLogItem {
  id: string;
  time: string;
  title: string;
  description: string;
  type: "teams" | "wheel" | "picker" | "shuffle";
}

interface TeamStudioClientProps {
  initialData: TeamStudioInitialResponse | null;
}

export function TeamStudioClient({ initialData }: TeamStudioClientProps) {
  const [data, setData] = useState<TeamStudioInitialResponse | null>(initialData);
  const [isPending, startTransition] = useTransition();

  // Master Workspace Tab ("attendance_activities" | "quick_tools")
  const [activeTab, setActiveTab] = useState<"attendance_activities" | "quick_tools">("attendance_activities");

  // Attendance Activities State
  const [isTeamBuilderOpen, setIsTeamBuilderOpen] = useState(false);
  const [selectedTeamSize, setSelectedTeamSize] = useState<number>(4);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<TeamAlgorithm>("smart_collaboration");
  const [currentGeneration, setCurrentGeneration] = useState<TeamGenerationResult | null>(null);
  const [previousGeneration, setPreviousGeneration] = useState<TeamGenerationResult | null>(null);
  const [generationHistory, setGenerationHistory] = useState<TeamGenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinnedMembersMap, setPinnedMembersMap] = useState<Record<number, string[]>>({});
  const [swapSourceMember, setSwapSourceMember] = useState<{ teamNumber: number; memberId: string; name: string } | null>(null);

  // Quick Tools State
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [selectedQuickMemberIds, setSelectedQuickMemberIds] = useState<string[]>(
    initialData?.enrolledMembers ? initialData.enrolledMembers.map((m) => m.memberId) : []
  );

  // Quick Tools Active Modals ("random_picker" | "spin_wheel" | "shuffle" | null)
  const [activeQuickTool, setActiveQuickTool] = useState<"random_picker" | "spin_wheel" | "shuffle" | null>(null);

  // Random Picker State
  const [pickerCount, setPickerCount] = useState<number>(1);
  const [pickerRemoveWinners, setPickerRemoveWinners] = useState<boolean>(false);
  const [pickerWinners, setPickerWinners] = useState<PresentMemberItem[]>([]);
  const [prevPickerWinners, setPrevPickerWinners] = useState<PresentMemberItem[]>([]);

  // Spin Wheel State
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelWinner, setWheelWinner] = useState<PresentMemberItem | null>(null);
  const [prevWheelWinner, setPrevWheelWinner] = useState<PresentMemberItem | null>(null);
  const [wheelRemoveWinner, setWheelRemoveWinner] = useState<boolean>(false);

  // Shuffle State
  const [shuffledMembers, setShuffledMembers] = useState<PresentMemberItem[]>([]);
  const [prevShuffledMembers, setPrevShuffledMembers] = useState<PresentMemberItem[]>([]);
  const [shuffledCopied, setShuffledCopied] = useState<boolean>(false);

  // CTO 1: Saved Presets
  const [presets, setPresets] = useState<PresetItem[]>([
    { id: "p1", name: "Workshop Teams", teamSize: 4, algorithm: "smart_collaboration" },
    { id: "p2", name: "Pair Programming", teamSize: 2, algorithm: "balanced_branch" },
    { id: "p3", name: "Hackathon Squads", teamSize: 5, algorithm: "smart_collaboration" },
  ]);
  const [newPresetName, setNewPresetName] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  // CTO 3: Session Notes State
  const [sessionNotes, setSessionNotes] = useState({
    challengeTitle: "Arduino Line Follower Challenge",
    mentorName: "Rahul Sharma",
    instructions: "Mix beginners with seniors for optimal peer learning.",
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // CTO 4: Activity Timeline Log
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([
    { id: "l1", time: "16:10 PM", title: "Session Initialized", description: "Loaded present members for session", type: "teams" },
  ]);

  const logActivity = (title: string, description: string, type: "teams" | "wheel" | "picker" | "shuffle") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setActivityLog((prev) => [{ id: `l_${Date.now()}`, time, title, description, type }, ...prev]);
  };

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

  // Team Builder Actions
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

        logActivity("Generated Teams", `Formed ${res.data.totalTeams} teams using ${res.data.algorithmLabel}`, "teams");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // CTO 2: Undo Team Generation
  const handleUndoGeneration = () => {
    if (previousGeneration) {
      const temp = currentGeneration;
      setCurrentGeneration(previousGeneration);
      setPreviousGeneration(temp);
      logActivity("Undo Generation", "Restored previous generation configuration", "teams");
    }
  };

  // CTO 1: Save Preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: PresetItem = {
      id: `p_${Date.now()}`,
      name: newPresetName.trim(),
      teamSize: selectedTeamSize,
      algorithm: selectedAlgorithm,
    };
    setPresets((prev) => [...prev, newPreset]);
    setNewPresetName("");
    setIsSavingPreset(false);
  };

  const handleLoadPreset = (preset: PresetItem) => {
    setSelectedTeamSize(preset.teamSize);
    setSelectedAlgorithm(preset.algorithm);
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

  // Quick Tools Filter & Selection
  const enrolledMembers = useMemo(() => data?.enrolledMembers || [], [data?.enrolledMembers]);

  const filteredEnrolledMembers = useMemo(() => {
    return enrolledMembers.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.membershipId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch = branchFilter === "all" || m.branch === branchFilter;
      const matchesYear = yearFilter === "all" || String(m.year) === yearFilter;
      return matchesSearch && matchesBranch && matchesYear;
    });
  }, [enrolledMembers, searchQuery, branchFilter, yearFilter]);

  const selectedMembersList = useMemo(() => {
    const set = new Set(selectedQuickMemberIds);
    return enrolledMembers.filter((m) => set.has(m.memberId));
  }, [enrolledMembers, selectedQuickMemberIds]);

  const handleSelectAll = () => {
    const allFilteredIds = filteredEnrolledMembers.map((m) => m.memberId);
    setSelectedQuickMemberIds(Array.from(new Set([...selectedQuickMemberIds, ...allFilteredIds])));
  };

  const handleClearSelection = () => {
    setSelectedQuickMemberIds([]);
  };

  const toggleQuickMemberSelection = (memberId: string) => {
    setSelectedQuickMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  // Quick Tools Actions
  const runRandomPicker = () => {
    if (selectedMembersList.length === 0) return;
    const pool = [...selectedMembersList];
    const count = Math.min(pickerCount, pool.length);
    const winners: PresentMemberItem[] = [];

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      winners.push(pool.splice(idx, 1)[0]);
    }

    setPrevPickerWinners(pickerWinners);
    setPickerWinners(winners);

    if (pickerRemoveWinners) {
      const winnerIds = new Set(winners.map((w) => w.memberId));
      setSelectedQuickMemberIds((prev) => prev.filter((id) => !winnerIds.has(id)));
    }

    logActivity("Random Picker", `Picked ${winners.map((w) => w.name).join(", ")}`, "picker");
  };

  const handleUndoPicker = () => {
    if (prevPickerWinners.length > 0) {
      setPickerWinners(prevPickerWinners);
      setPrevPickerWinners([]);
      logActivity("Undo Picker", "Restored previous picker winners", "picker");
    }
  };

  const spinWheel = () => {
    if (selectedMembersList.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setPrevWheelWinner(wheelWinner);
    setWheelWinner(null);

    const extraRounds = 5 + Math.floor(Math.random() * 5);
    const randomDegree = Math.floor(Math.random() * 360);
    const totalDegree = wheelRotation + extraRounds * 360 + randomDegree;

    setWheelRotation(totalDegree);

    setTimeout(() => {
      setIsSpinning(false);
      const winnerIdx = Math.floor(Math.random() * selectedMembersList.length);
      const winner = selectedMembersList[winnerIdx];
      setWheelWinner(winner);

      if (wheelRemoveWinner) {
        setSelectedQuickMemberIds((prev) => prev.filter((id) => id !== winner.memberId));
      }

      logActivity("Spin Wheel", `Wheel selected winner: ${winner.name}`, "wheel");
    }, 3000);
  };

  const handleUndoWheel = () => {
    if (prevWheelWinner) {
      setWheelWinner(prevWheelWinner);
      setPrevWheelWinner(null);
      logActivity("Undo Spin", "Restored previous wheel winner", "wheel");
    }
  };

  const runMemberShuffle = () => {
    if (selectedMembersList.length === 0) return;
    const pool = [...selectedMembersList];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setPrevShuffledMembers(shuffledMembers);
    setShuffledMembers(pool);
    logActivity("Member Shuffle", `Shuffled ${pool.length} members`, "shuffle");
  };

  const handleUndoShuffle = () => {
    if (prevShuffledMembers.length > 0) {
      setShuffledMembers(prevShuffledMembers);
      setPrevShuffledMembers([]);
      logActivity("Undo Shuffle", "Restored previous shuffled list", "shuffle");
    }
  };

  const handleCopyShuffled = () => {
    if (shuffledMembers.length === 0) return;
    const lines = ["RCMS Team Studio — Shuffled Member List:"];
    shuffledMembers.forEach((m, idx) => {
      lines.push(`${idx + 1}. ${m.name} (${m.membershipId}) - ${m.branch} Yr ${m.year}`);
    });
    navigator.clipboard.writeText(lines.join("\n"));
    setShuffledCopied(true);
    setTimeout(() => setShuffledCopied(false), 2000);
  };

  const handleExportShuffledCsv = () => {
    if (shuffledMembers.length === 0) return;
    const rows = ['"Position","Member Name","Membership ID","Branch","Year"'];
    shuffledMembers.forEach((m, idx) => {
      rows.push(`"${idx + 1}","${m.name}","${m.membershipId}","${m.branch}","${m.year}"`);
    });
    const csvContent = `\uFEFF${rows.join("\r\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `shuffled_members_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading Team Studio Workspaces...
      </div>
    );
  }

  const { completedLiveSessions, selectedSession, presentMembers } = data;

  return (
    <div className="space-y-6 text-left">
      
      {/* ── TOP MASTER WORKSPACE TABS ────────────────────────────────────────── */}
      <div className="border-b border-border flex items-center justify-between">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("attendance_activities")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "attendance_activities"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Attendance Activities (Default)</span>
            <Badge variant="outline" className="text-[10px] bg-blue-950/40 text-blue-400 border-blue-800/60">
              Live Scoped
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quick_tools")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "quick_tools"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wand2 className="h-4 w-4" />
            <span>Quick Tools (Manual Selection)</span>
            <Badge variant="outline" className="text-[10px] bg-purple-950/40 text-purple-400 border-purple-800/60">
              Independent
            </Badge>
          </button>
        </nav>
      </div>

      {/* ── WORKSPACE 1: ATTENDANCE ACTIVITIES (DEFAULT) ──────────────────────── */}
      {activeTab === "attendance_activities" && (
        <div className="space-y-8">
          {selectedSession ? (
            <>
              {/* Attendance Session Selector & Session Notes Card */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
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

                {/* CTO 3: Session Notes Component */}
                <div className="rounded-xl border border-blue-800/30 bg-blue-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <span className="font-bold text-xs text-foreground">Session Challenge &amp; Notes</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(!isEditingNotes)} className="h-7 text-xs text-blue-400">
                      {isEditingNotes ? "Done Editing" : "Edit Notes"}
                    </Button>
                  </div>

                  {isEditingNotes ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-muted-foreground font-bold">Challenge Title:</label>
                        <input
                          type="text"
                          value={sessionNotes.challengeTitle}
                          onChange={(e) => setSessionNotes({ ...sessionNotes, challengeTitle: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-bold">Mentor Name:</label>
                        <input
                          type="text"
                          value={sessionNotes.mentorName}
                          onChange={(e) => setSessionNotes({ ...sessionNotes, mentorName: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-bold">Special Instructions:</label>
                        <textarea
                          rows={2}
                          value={sessionNotes.instructions}
                          onChange={(e) => setSessionNotes({ ...sessionNotes, instructions: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-3 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-semibold">Today&apos;s Challenge</span>
                        <span className="font-bold text-foreground">{sessionNotes.challengeTitle}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-semibold">Session Mentor</span>
                        <span className="font-bold text-foreground">{sessionNotes.mentorName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-semibold">Special Instructions</span>
                        <span className="font-bold text-blue-300">{sessionNotes.instructions}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Activity Cards Grid */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-400" /> Post-Attendance Activity Center
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div
                    onClick={() => setIsTeamBuilderOpen(true)}
                    className="rounded-2xl border border-blue-800/60 bg-card hover:bg-muted/20 p-5 shadow-sm space-y-3 cursor-pointer transition-all hover:scale-[1.01] group border-l-4 border-l-blue-500"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🧩</span>
                      <Badge variant="success" className="text-[10px] uppercase font-bold">
                        Smart Team Engine
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
                          Attendance activity coming in future releases.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4 shadow-sm">
              <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-bold text-foreground">No Completed LIVE Attendance Sessions Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Team Studio Attendance Activities operate strictly on completed LIVE attendance sessions. Switch to <strong>Quick Tools</strong> above to run tools using active semester enrolled members.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── WORKSPACE 2: QUICK TOOLS (MANUAL SELECTION) ───────────────────────── */}
      {activeTab === "quick_tools" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-br from-card via-card to-purple-950/20 p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5 text-purple-400" />
                  <h2 className="text-base font-bold text-foreground">Quick Tools Member Selector</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select enrolled members from <strong>{data.activeSemesterName}</strong> to use with Quick Tools.
                </p>
              </div>

              <Badge variant="outline" className="bg-purple-950/80 text-purple-400 border-purple-800/60 font-mono text-xs px-3 py-1">
                {selectedQuickMemberIds.length} / {enrolledMembers.length} Members Selected
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name or membership ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                />
              </div>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                <option value="all">All Branches</option>
                {RCMS_BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                <option value="all">All Academic Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll} className="flex-1 text-xs font-bold gap-1">
                  <CheckSquare className="h-3.5 w-3.5 text-purple-400" />
                  <span>Select All</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearSelection} className="flex-1 text-xs gap-1">
                  <Square className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Clear</span>
                </Button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-border/60 rounded-xl p-3 bg-background/50 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              {filteredEnrolledMembers.map((m) => {
                const isSelected = selectedQuickMemberIds.includes(m.memberId);
                return (
                  <div
                    key={m.memberId}
                    onClick={() => toggleQuickMemberSelection(m.memberId)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "border-purple-500 bg-purple-950/30 text-purple-300 font-semibold"
                        : "border-border/40 bg-muted/10 hover:bg-muted/20 text-foreground"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-purple-400 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="truncate font-bold">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{m.membershipId}</div>
                      </div>
                    </div>

                    <Badge variant="secondary" className="text-[9px] shrink-0">
                      {m.branch} • Yr {m.year}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-400" /> Interactive Quick Tools
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                onClick={() => setActiveQuickTool("random_picker")}
                className="rounded-2xl border border-purple-800/60 bg-card hover:bg-muted/20 p-5 shadow-sm space-y-3 cursor-pointer transition-all hover:scale-[1.01] group border-l-4 border-l-purple-500"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🎯</span>
                  <Badge variant="success" className="text-[10px] uppercase font-bold">
                    Active Tool
                  </Badge>
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground group-hover:text-purple-400 transition-colors">
                    Random Picker
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Randomly choose single or multiple winners from selected members with optional winner removal.
                  </p>
                </div>
                <div className="text-xs font-bold text-purple-400 flex items-center gap-1 pt-2">
                  <span>Launch Random Picker</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => setActiveQuickTool("spin_wheel")}
                className="rounded-2xl border border-purple-800/60 bg-card hover:bg-muted/20 p-5 shadow-sm space-y-3 cursor-pointer transition-all hover:scale-[1.01] group border-l-4 border-l-purple-500"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🎡</span>
                  <Badge variant="success" className="text-[10px] uppercase font-bold">
                    Active Tool
                  </Badge>
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground group-hover:text-purple-400 transition-colors">
                    Spin Wheel
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Interactive animated wheel loaded with selected members for gamified giveaways and presentation duty.
                  </p>
                </div>
                <div className="text-xs font-bold text-purple-400 flex items-center gap-1 pt-2">
                  <span>Launch Spin Wheel</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => {
                  setActiveQuickTool("shuffle");
                  runMemberShuffle();
                }}
                className="rounded-2xl border border-purple-800/60 bg-card hover:bg-muted/20 p-5 shadow-sm space-y-3 cursor-pointer transition-all hover:scale-[1.01] group border-l-4 border-l-purple-500"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🔀</span>
                  <Badge variant="success" className="text-[10px] uppercase font-bold">
                    Active Tool
                  </Badge>
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground group-hover:text-purple-400 transition-colors">
                    Member Shuffle
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Instantly shuffle selected members into a random ordered list with Copy, Print, and CSV export.
                  </p>
                </div>
                <div className="text-xs font-bold text-purple-400 flex items-center gap-1 pt-2">
                  <span>Launch Member Shuffle</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {["🗳 Quick Poll", "🧠 Ice Breakers", "🏆 Tournament Generator", "⚙ Project Allocation"].map((item, idx) => (
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
                      Quick Tool utility coming in future Team Studio releases.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CTO 4: ACTIVITY TIMELINE LOG ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <h3 className="font-bold text-base text-foreground">Session Activity Log &amp; Timeline</h3>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {activityLog.length} Activities Logged
          </Badge>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {activityLog.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-muted/10 text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-muted-foreground font-mono text-[10px] bg-background px-2 py-0.5 rounded border border-border">
                  {log.time}
                </span>
                <span className="font-bold text-foreground">{log.title}</span>
                <span className="text-muted-foreground truncate max-w-xs">{log.description}</span>
              </div>
              <Badge variant="secondary" className="text-[9px] uppercase">
                {log.type}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL 1: RANDOM PICKER WITH UNDO ──────────────────────────────────── */}
      {activeQuickTool === "random_picker" && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎯</span>
                <h3 className="font-bold text-base text-foreground">Random Picker Tool</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveQuickTool(null)} className="rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1 bg-muted/10 p-3 rounded-xl border border-border/50">
                <span className="font-semibold text-muted-foreground">Active Pool:</span>
                <div className="font-bold text-foreground">{selectedMembersList.length} Selected Members</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Number of Winners:</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedMembersList.length || 1}
                    value={pickerCount}
                    onChange={(e) => setPickerCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Winner Options:</label>
                  <label className="flex items-center space-x-2 border border-border/50 p-2 rounded-xl cursor-pointer bg-background">
                    <input
                      type="checkbox"
                      checked={pickerRemoveWinners}
                      onChange={(e) => setPickerRemoveWinners(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-[11px]">Remove winners after pick</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={runRandomPicker}
                  disabled={selectedMembersList.length === 0}
                  className="flex-1 text-xs font-bold py-5 bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm"
                >
                  <Dice5 className="h-4 w-4" />
                  <span>Pick Random Winner(s)</span>
                </Button>

                {/* CTO 2: Undo Picker */}
                {prevPickerWinners.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleUndoPicker} className="py-5 text-xs gap-1 text-amber-400">
                    <Undo2 className="h-4 w-4" />
                    <span>Undo Pick</span>
                  </Button>
                )}
              </div>

              {pickerWinners.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-xs text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-400" /> Selected Winner(s)
                  </h4>
                  <div className="space-y-2">
                    {pickerWinners.map((w, idx) => (
                      <div key={w.memberId} className="flex items-center justify-between p-3 rounded-xl border border-purple-800/60 bg-purple-950/30 text-foreground font-bold">
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-400">#{idx + 1}</span>
                          <span>{w.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">({w.membershipId})</span>
                        </div>
                        <Badge variant="secondary">{w.branch} Yr {w.year}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setActiveQuickTool(null)} className="text-xs">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: SPIN WHEEL WITH UNDO ─────────────────────────────────────── */}
      {activeQuickTool === "spin_wheel" && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎡</span>
                <h3 className="font-bold text-base text-foreground">Interactive Spin Wheel</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveQuickTool(null)} className="rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5 text-xs text-center">
              <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
                <div className="absolute -top-2 z-20 text-red-500 font-bold text-xl drop-shadow-md">
                  ▼
                </div>

                <div
                  className="h-44 w-44 rounded-full border-4 border-purple-500/80 bg-purple-950/40 flex items-center justify-center shadow-lg transition-all duration-[3000ms] ease-out overflow-hidden"
                  style={{ transform: `rotate(${wheelRotation}deg)` }}
                >
                  <svg viewBox="0 0 100 100" className="h-full w-full">
                    {(() => {
                      const count = Math.max(1, selectedMembersList.length);
                      const sliceAngle = 360 / count;
                      const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];
                      return selectedMembersList.slice(0, 12).map((m, idx) => {
                        const startAngle = idx * sliceAngle;
                        const endAngle = (idx + 1) * sliceAngle;
                        const startRad = (startAngle - 90) * (Math.PI / 180);
                        const endRad = (endAngle - 90) * (Math.PI / 180);
                        const x1 = 50 + 50 * Math.cos(startRad);
                        const y1 = 50 + 50 * Math.sin(startRad);
                        const x2 = 50 + 50 * Math.cos(endRad);
                        const y2 = 50 + 50 * Math.sin(endRad);
                        const d = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                        return <path key={m.memberId} d={d} fill={colors[idx % colors.length]} opacity="0.8" />;
                      });
                    })()}
                  </svg>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <label className="flex items-center space-x-2 border border-border/50 p-2 rounded-xl cursor-pointer bg-background">
                  <input
                    type="checkbox"
                    checked={wheelRemoveWinner}
                    onChange={(e) => setWheelRemoveWinner(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs">Remove winner after spin</span>
                </label>

                <Button
                  onClick={spinWheel}
                  disabled={isSpinning || selectedMembersList.length === 0}
                  className="text-xs font-bold px-6 py-5 bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm"
                >
                  <RotateCw className={`h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
                  <span>{isSpinning ? "Spinning..." : "SPIN WHEEL 🎡"}</span>
                </Button>

                {/* CTO 2: Undo Spin */}
                {prevWheelWinner && (
                  <Button variant="outline" size="sm" onClick={handleUndoWheel} className="py-5 text-xs gap-1 text-amber-400">
                    <Undo2 className="h-4 w-4" />
                    <span>Undo Spin</span>
                  </Button>
                )}
              </div>

              {wheelWinner && (
                <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-4 space-y-1 animate-bounce">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">🎉 Winner Selected! 🎉</span>
                  <div className="text-base font-extrabold text-foreground">{wheelWinner.name} ({wheelWinner.membershipId})</div>
                  <div className="text-xs text-emerald-300 font-semibold">{wheelWinner.branch} • Year {wheelWinner.year}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setActiveQuickTool(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: MEMBER SHUFFLE WITH UNDO ───────────────────────────────── */}
      {activeQuickTool === "shuffle" && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔀</span>
                <h3 className="font-bold text-base text-foreground">Member Shuffle Tool</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveQuickTool(null)} className="rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button onClick={runMemberShuffle} size="sm" className="text-xs font-bold gap-1.5 bg-purple-600 text-white">
                    <Shuffle className="h-3.5 w-3.5" />
                    <span>Reshuffle Now</span>
                  </Button>

                  {/* CTO 2: Undo Shuffle */}
                  {prevShuffledMembers.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleUndoShuffle} className="text-xs gap-1 text-amber-400">
                      <Undo2 className="h-3.5 w-3.5" />
                      <span>Undo</span>
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleCopyShuffled} className="text-xs gap-1">
                    {shuffledCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{shuffledCopied ? "Copied" : "Copy"}</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportShuffledCsv} className="text-xs gap-1">
                    <Download className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </Button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 border border-border/60 rounded-xl p-3 bg-background">
                {shuffledMembers.map((m, idx) => (
                  <div key={m.memberId} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-muted/10">
                    <div className="flex items-center space-x-2 font-semibold">
                      <span className="text-purple-400 font-mono w-6">#{idx + 1}</span>
                      <span>{m.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">({m.membershipId})</span>
                    </div>
                    <Badge variant="secondary">{m.branch} Yr {m.year}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setActiveQuickTool(null)} className="text-xs">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEAM BUILDER WORKSPACE WITH PRESETS & FAVORITES ──────────────────── */}
      {isTeamBuilderOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-4xl bg-card h-full border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden text-left">
            <div className="p-6 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center text-xl font-bold">
                  🧩
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Smart Team Builder Workspace</h2>
                  <p className="text-xs text-muted-foreground">Collaboration intelligence engine with saved presets &amp; undo</p>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => setIsTeamBuilderOpen(false)} className="rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {selectedSession && (
                <div className="rounded-xl border border-blue-800/40 bg-blue-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-bold text-blue-400">Target Session: {selectedSession.title}</div>
                    <div className="text-[11px] text-muted-foreground">Date: {selectedSession.date} • Semester: {selectedSession.semesterName}</div>
                  </div>
                  <Badge variant="success" className="text-xs font-bold px-3 py-1 shrink-0">
                    {presentMembers.length} Present Members Available
                  </Badge>
                </div>
              )}

              {/* CTO 1: Saved Presets Bar */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-foreground">
                    <Bookmark className="h-4 w-4 text-amber-400" />
                    <span>Saved Configuration Presets</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsSavingPreset(!isSavingPreset)} className="h-7 text-xs text-amber-400 gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save Current Preset</span>
                  </Button>
                </div>

                {isSavingPreset && (
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="Preset name (e.g. Workshop Teams)..."
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                    />
                    <Button size="sm" onClick={handleSavePreset} className="text-xs bg-amber-500 text-black font-bold">
                      Save
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleLoadPreset(p)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedTeamSize === p.teamSize && selectedAlgorithm === p.algorithm
                          ? "border-amber-500 bg-amber-950/40 text-amber-300 font-bold"
                          : "border-border/60 bg-background text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span>{p.name}</span>
                      <span className="text-[10px] text-muted-foreground">({p.teamSize}/team)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameter Controls Grid */}
              <div className="grid gap-4 md:grid-cols-2">
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

                <div className="space-y-3">
                  <h4 className="font-bold text-foreground uppercase tracking-wide text-[11px]">Balancing Algorithm</h4>
                  <select
                    value={selectedAlgorithm}
                    onChange={(e) => setSelectedAlgorithm(e.target.value as TeamAlgorithm)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    <option value="smart_collaboration">(Recommended) Smart Collaboration Engine</option>
                    <option value="balanced_branch">Balanced Branch Distribution (CSE, CSM, ECE...)</option>
                    <option value="balanced_year">Balanced Academic Year Distribution (Yr 1 - Yr 4)</option>
                    <option value="random">Pure Random Distribution</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons: Generate & CTO 2: Undo Generation */}
              <div className="flex flex-col sm:flex-row items-center gap-3 border-y border-border/60 py-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 w-full text-xs font-bold gap-2 py-5 shadow-sm"
                >
                  <Sparkles className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                  <span>{isGenerating ? "Generating Teams..." : currentGeneration ? "Regenerate Teams" : "Generate Teams"}</span>
                </Button>

                {previousGeneration && (
                  <Button variant="outline" size="sm" onClick={handleUndoGeneration} className="py-5 text-xs gap-1.5 text-amber-400 font-bold">
                    <Undo2 className="h-4 w-4" />
                    <span>Undo Last Generation</span>
                  </Button>
                )}

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

              {swapSourceMember && (
                <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-3 text-xs flex items-center justify-between text-amber-300 font-semibold animate-pulse">
                  <span>Swap Mode: Click another member in any team to swap with {swapSourceMember.name} (Team {swapSourceMember.teamNumber}).</span>
                  <Button variant="ghost" size="sm" onClick={() => setSwapSourceMember(null)} className="h-6 text-[10px] text-amber-300">
                    Cancel Swap
                  </Button>
                </div>
              )}

              {currentGeneration && (
                <div className="space-y-4">
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
                <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3 bg-muted/10">
                  <Layers className="h-10 w-10 text-muted-foreground mx-auto" />
                  <h4 className="font-bold text-sm text-foreground">Smart Team Builder Ready</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Select team size and balancing rules above, then click <strong>Generate Teams</strong> to create balanced project teams from present members.
                  </p>
                </div>
              )}

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
