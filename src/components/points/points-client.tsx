"use client";

/**
 * Points Engine & Gamification Platform – CTO Revision
 *
 * Operational workflow:
 *   1. Coordinator selects an Active Task chip
 *   2. "Grant Points" button appears in every member row
 *   3. One-click awards points + creates task completion + updates leaderboard
 *   4. Row transitions to "Completed ✓" with an Undo button
 *   5. Deselecting the chip removes the action column entirely
 */

import { useState, useTransition, useCallback } from "react";
import {
  awardPointsAction,
  deductPointsAction,
  rollbackTransactionAction,
  createPointRuleAction,
  getLeaderboardAction,
} from "@/actions/points";
import {
  completeTaskAction,
  revokeTaskCompletionAction,
  getTaskMemberCompletionsAction,
} from "@/actions/operations";
import { LeaderboardItem } from "@/repositories/points";
import { TaskSelect, TaskCompletionSelect } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Star,
  Plus,
  RotateCcw,
  RefreshCw,
  Search,
  X,
  Sliders,
  Zap,
  CheckCircle2,
  Check,
} from "lucide-react";

interface PointsClientProps {
  initialLeaderboard: LeaderboardItem[];
  initialTasks?: TaskSelect[];
}

export function PointsClient({ initialLeaderboard, initialTasks = [] }: PointsClientProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>(initialLeaderboard);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"leaderboard" | "rules" | "tiers">("leaderboard");
  const [isPending, startTransition] = useTransition();

  // ── Task Selection ──────────────────────────────────────────────
  const activeTasks = initialTasks.filter((t) => t.status === "active");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Map: memberId → TaskCompletionSelect (for the selected task)
  const [completionMap, setCompletionMap] = useState<Record<string, TaskCompletionSelect>>({});

  // Per-row pending set so individual rows show a loading state
  const [rowPending, setRowPending] = useState<Set<string>>(new Set());

  // Modals
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // Bulk selection
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Manual award form
  const [targetMemberId, setTargetMemberId] = useState("");
  const [pointsAmount, setPointsAmount] = useState(25);
  const [category, setCategory] = useState("task");
  const [remarks, setRemarks] = useState("");
  const [txId, setTxId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");

  // Rule form
  const [ruleTrigger, setRuleTrigger] = useState("task_completed");
  const [ruleCategory, setRuleCategory] = useState("task");
  const [rulePoints, setRulePoints] = useState(20);
  const [ruleDescription, setRuleDescription] = useState("");

  // ── Derived ─────────────────────────────────────────────────────
  const selectedTask = activeTasks.find((t) => t.id === selectedTaskId) ?? null;

  const filteredLeaderboard = leaderboard.filter((item) =>
    item.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // ── Helpers ──────────────────────────────────────────────────────
  const refreshLeaderboard = () =>
    startTransition(async () => {
      const res = await getLeaderboardAction();
      if (res.success && res.data) setLeaderboard(res.data.items);
    });

  const loadCompletionsForTask = useCallback(async (taskId: string) => {
    const res = await getTaskMemberCompletionsAction(taskId);
    if (res.success && res.data) setCompletionMap(res.data);
    else setCompletionMap({});
  }, []);

  const handleSelectTask = async (taskId: string) => {
    if (selectedTaskId === taskId) {
      // Deselect
      setSelectedTaskId(null);
      setCompletionMap({});
      setSelectedMemberIds([]);
      return;
    }
    setSelectedTaskId(taskId);
    setSelectedMemberIds([]);
    await loadCompletionsForTask(taskId);
  };

  // ── Row-level Grant Points ────────────────────────────────────────
  const handleGrantPoints = async (memberId: string) => {
    if (!selectedTask) return;

    setRowPending((p) => new Set([...p, memberId]));
    try {
      const res = await completeTaskAction({ taskId: selectedTask.id, memberId });
      if (res.success) {
        // Optimistic: add points to this member's total and re-sort
        const pts = (selectedTask as any).points ?? 0;
        setLeaderboard((prev) =>
          [...prev]
            .map((item) =>
              item.memberId === memberId
                ? { ...item, totalPoints: (item.totalPoints || 0) + pts }
                : item
            )
            .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        );
        await loadCompletionsForTask(selectedTask.id);
      } else {
        alert(res.error?.message || "Failed to grant points");
      }
    } finally {
      setRowPending((p) => { const n = new Set(p); n.delete(memberId); return n; });
    }
  };

  // ── Row-level Undo ────────────────────────────────────────────────
  const handleUndoCompletion = async (memberId: string) => {
    const completion = completionMap[memberId] as any;
    if (!completion?.id) return;

    setRowPending((p) => new Set([...p, memberId]));
    try {
      const res = await revokeTaskCompletionAction(completion.id);
      if (res.success) {
        // Optimistic: subtract points from this member and re-sort
        const pts = (selectedTask as any)?.points ?? 0;
        setLeaderboard((prev) =>
          [...prev]
            .map((item) =>
              item.memberId === memberId
                ? { ...item, totalPoints: Math.max(0, (item.totalPoints || 0) - pts) }
                : item
            )
            .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        );
        setCompletionMap((prev) => {
          const next = { ...prev };
          delete next[memberId];
          return next;
        });
      } else {
        alert(res.error?.message || "Failed to undo");
      }
    } finally {
      setRowPending((p) => { const n = new Set(p); n.delete(memberId); return n; });
    }
  };

  // ── Bulk operations ───────────────────────────────────────────────
  const handleSelectAll = (checked: boolean) =>
    setSelectedMemberIds(checked ? filteredLeaderboard.map((i) => i.memberId) : []);

  const handleToggleMember = (id: string) =>
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleBulkAward = () => {
    if (!selectedTask || selectedMemberIds.length === 0) return;
    startTransition(async () => {
      let ok = 0;
      for (const id of selectedMemberIds) {
        const res = await completeTaskAction({ taskId: selectedTask.id, memberId: id });
        if (res.success) ok++;
      }
      alert(`Awarded ${selectedTask.points} pts to ${ok} member(s)`);
      setSelectedMemberIds([]);
      await loadCompletionsForTask(selectedTask.id);
      refreshLeaderboard();
    });
  };

  const handleBulkUndo = () => {
    if (!selectedTask || selectedMemberIds.length === 0) return;
    startTransition(async () => {
      let ok = 0;
      for (const id of selectedMemberIds) {
        const completion = completionMap[id] as any;
        if (!completion?.id) continue;
        const res = await revokeTaskCompletionAction(completion.id);
        if (res.success) ok++;
      }
      alert(`Revoked from ${ok} member(s)`);
      setSelectedMemberIds([]);
      await loadCompletionsForTask(selectedTask.id);
      refreshLeaderboard();
    });
  };

  // ── Manual Award ──────────────────────────────────────────────────
  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const pts = Math.abs(pointsAmount);
      const res = pointsAmount > 0
        ? await awardPointsAction({ memberId: targetMemberId, category, points: pts, remarks: remarks || "Manual award" })
        : await deductPointsAction({ memberId: targetMemberId, category: "penalty", points: pts, remarks: remarks || "Manual deduction" });

      if (res.success) {
        alert(`Points ${pointsAmount > 0 ? "awarded" : "deducted"} successfully!`);
        setIsAwardModalOpen(false);
        setTargetMemberId(""); setRemarks("");
        refreshLeaderboard();
      } else {
        alert(res.error?.message || "Failed");
      }
    });
  };

  const handleRollback = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await rollbackTransactionAction({ transactionId: txId, reason: rollbackReason });
      if (res.success) {
        alert("Transaction rolled back!");
        setIsRollbackModalOpen(false); setTxId(""); setRollbackReason("");
        refreshLeaderboard();
      } else {
        alert(res.error?.message || "Rollback failed");
      }
    });
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPointRuleAction({ trigger: ruleTrigger, category: ruleCategory, points: rulePoints, description: ruleDescription || "Rule" });
      if (res.success) { alert("Rule created!"); setIsRuleModalOpen(false); }
      else alert(res.error?.message || "Failed to create rule");
    });
  };

  // ── Badge tier ────────────────────────────────────────────────────
  const getBadgeTier = (pts: number) => {
    if (pts >= 300) return { name: "Platinum Master",    color: "bg-purple-900/60 text-purple-300 border border-purple-600/40" };
    if (pts >= 150) return { name: "Gold Pioneer",       color: "bg-amber-900/60  text-amber-300  border border-amber-600/40" };
    if (pts >= 50)  return { name: "Silver Contributor", color: "bg-slate-800 text-slate-200 border border-slate-600" };
    return               { name: "Bronze Rookie",        color: "bg-zinc-800   text-zinc-300   border border-zinc-700" };
  };

  return (
    <div className="space-y-6">

      {/* ── Navigation + Action Bar ─────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center border-b border-border/70 text-sm font-semibold">
          {(["leaderboard", "rules", "tiers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 flex items-center gap-1.5 transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-400 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "leaderboard" && <Trophy className="h-3.5 w-3.5" />}
              {tab === "rules"       && <Sliders className="h-3.5 w-3.5" />}
              {tab === "tiers"       && <Star className="h-3.5 w-3.5" />}
              {tab === "leaderboard" ? "Leaderboard Rankings" : tab === "rules" ? "Scoring Rules Engine" : "Achievement Tiers"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refreshLeaderboard} disabled={isPending} className="h-9 w-9 border-border bg-card">
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" className="h-9 text-xs border-border bg-card gap-1.5" onClick={() => setIsRollbackModalOpen(true)}>
            <RotateCcw className="h-3.5 w-3.5" /> Rollback Transaction
          </Button>
          <Button className="h-9 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-1.5" onClick={() => setIsAwardModalOpen(true)}>
            <Plus className="h-4 w-4" /> Manual Award / Penalty
          </Button>
        </div>
      </div>

      {/* ── Active Tasks Chip Strip ──────────────────────────────── */}
      {activeTab === "leaderboard" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">Active Tasks</span>
            {activeTasks.length > 0 && (
              <span className="text-[11px] text-muted-foreground">— click a task chip to enable one-click point awarding</span>
            )}
          </div>

          {activeTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-1">No active tasks found. Create and activate tasks in the Task Center first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeTasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                return (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task.id)}
                    title={[
                      task.description ? `${task.description}` : null,
                      `Points: ${task.points ?? 0}`,
                      task.isUnlimited ? "Unlimited completions" : task.maxMembers ? `Max ${task.maxMembers} members` : null,
                      task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : null,
                    ].filter(Boolean).join("\n")}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                      isSelected
                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/40"
                        : "bg-card border-border text-foreground hover:border-blue-500/60 hover:bg-blue-950/20"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{task.title}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {task.points ?? 0} pts
                    </span>
                    {task.isUnlimited && (
                      <span className={`text-[10px] ${isSelected ? "text-blue-200" : "text-muted-foreground"}`}>∞</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected task summary pill */}
          {selectedTask && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-800/40 bg-blue-950/20 px-4 py-2.5 text-xs flex-wrap">
              <span className="font-bold text-blue-300">Selected:</span>
              <span className="font-semibold text-foreground">{selectedTask.title}</span>
              <span className="text-emerald-400 font-bold">{selectedTask.points} Points</span>
              <span className="text-muted-foreground">{selectedTask.isUnlimited ? "Unlimited" : `Max ${selectedTask.maxMembers ?? "—"} members`}</span>
              <button
                onClick={() => { setSelectedTaskId(null); setCompletionMap({}); setSelectedMemberIds([]); }}
                className="ml-auto text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Deselect
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LEADERBOARD VIEW ─────────────────────────────────────── */}
      {activeTab === "leaderboard" && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search members to award..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedMemberIds.length > 0 && selectedTask && (
                <>
                  <Button size="sm" onClick={handleBulkAward} disabled={isPending} className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white">
                    Award Selected ({selectedTask.points} pts)
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkUndo} disabled={isPending} className="h-8 text-xs border-border bg-card gap-1">
                    <RotateCcw className="h-3 w-3" /> Bulk Undo
                  </Button>
                </>
              )}
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none">
                <option value="all">Branch: All</option>
                <option value="cse">CSE</option>
                <option value="ece">ECE</option>
                <option value="mech">MECH</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
            <table className="w-full text-left text-xs text-foreground">
              <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={filteredLeaderboard.length > 0 && selectedMemberIds.length === filteredLeaderboard.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3">RANK</th>
                  <th className="px-4 py-3">MEMBER NAME</th>
                  <th className="px-4 py-3">MEMBERSHIP ID</th>
                  <th className="px-4 py-3">ROLL NUMBER</th>
                  <th className="px-4 py-3">TOTAL POINTS</th>
                  <th className="px-4 py-3">BADGE TIER</th>
                  {selectedTask && <th className="px-4 py-3 text-right">TASK ACTION</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={selectedTask ? 7 : 6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No members found.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((item, idx) => {
                    const badge = getBadgeTier(item.totalPoints || 0);
                    const isRowPending = rowPending.has(item.memberId);
                    const isCompleted = !!completionMap[item.memberId];
                    const isSelected = selectedMemberIds.includes(item.memberId);

                    return (
                      <tr
                        key={item.memberId}
                        className={`hover:bg-accent/30 transition-colors ${isSelected ? "bg-blue-950/20" : ""} ${isCompleted ? "bg-emerald-950/10" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={isSelected} onChange={() => handleToggleMember(item.memberId)} className="rounded" />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-400">
                          <span className="flex items-center gap-1.5">
                            {idx === 0 && <Trophy className="h-3.5 w-3.5 text-amber-400" />}
                            {idx === 1 && <Trophy className="h-3.5 w-3.5 text-slate-300" />}
                            {idx === 2 && <Trophy className="h-3.5 w-3.5 text-amber-600" />}
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{item.memberName}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{item.membershipId || "—"}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{item.rollNumber || "—"}</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-400">{item.totalPoints || 0} Pts</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${badge.color}`}>
                            {badge.name}
                          </span>
                        </td>

                        {/* Action cell — only rendered when a task is selected */}
                        {selectedTask && (
                          <td className="px-4 py-3 text-right">
                            {isCompleted ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Completed ✓
                                </span>
                                <button
                                  onClick={() => handleUndoCompletion(item.memberId)}
                                  disabled={isRowPending}
                                  className="text-[10px] text-muted-foreground hover:text-red-400 underline underline-offset-2 transition-colors disabled:opacity-50"
                                >
                                  Undo
                                </button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                disabled={isRowPending || isPending}
                                onClick={() => handleGrantPoints(item.memberId)}
                                className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md px-2.5 shadow-sm gap-1 disabled:opacity-50"
                              >
                                <Zap className="h-3 w-3 text-amber-300" />
                                {isRowPending ? "..." : "Grant Points"}
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── RULES ENGINE ─────────────────────────────────────────── */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground">Active Scoring Rules</h3>
            <Button size="sm" onClick={() => setIsRuleModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs">+ New Rule</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { trigger: "Task Completed",    pts: 20, desc: "Awarded automatically on task completion" },
              { trigger: "Attendance Session", pts: 15, desc: "Awarded per verified attendance scan" },
            ].map((r) => (
              <div key={r.trigger} className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs text-foreground">{r.trigger}</span>
                  <span className="text-emerald-400 font-bold text-xs">+{r.pts} Pts</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACHIEVEMENT TIERS ────────────────────────────────────── */}
      {activeTab === "tiers" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Bronze Rookie",      range: "0 – 49 Pts",    pct: 30, color: "bg-amber-600" },
            { name: "Silver Contributor", range: "50 – 149 Pts",  pct: 60, color: "bg-slate-400" },
            { name: "Gold Pioneer",       range: "150 – 299 Pts", pct: 40, color: "bg-amber-400" },
            { name: "Platinum Master",    range: "300+ Pts",      pct: 15, color: "bg-purple-500" },
          ].map((tier) => (
            <div key={tier.name} className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-foreground">{tier.name}</span>
                <span className="text-[11px] font-mono text-muted-foreground">{tier.range}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className={`${tier.color} h-1.5 rounded-full`} style={{ width: `${tier.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Manual Award / Penalty Modal ─────────────────────────── */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-bold">Manual Award / Penalty</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAwardModalOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleAwardPoints} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Target Member</label>
                <select value={targetMemberId} onChange={(e) => setTargetMemberId(e.target.value)} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs">
                  <option value="">Select member...</option>
                  {leaderboard.map((m) => <option key={m.memberId} value={m.memberId}>{m.memberName} ({m.rollNumber || "—"})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Points (positive = award, negative = deduction)</label>
                <input type="number" value={pointsAmount} onChange={(e) => setPointsAmount(Number(e.target.value))} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs">
                  <option value="task">Task Completion</option>
                  <option value="attendance">Attendance</option>
                  <option value="bonus">Special Bonus</option>
                  <option value="penalty">Penalty Deduction</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Remarks</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder="Reason..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAwardModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white">Submit</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Rollback Modal ───────────────────────────────────────── */}
      {isRollbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-bold">Rollback Transaction</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsRollbackModalOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleRollback} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Transaction ID (UUID)</label>
                <input type="text" value={txId} onChange={(e) => setTxId(e.target.value)} required placeholder="e.g. 123e4567-..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Reason</label>
                <textarea value={rollbackReason} onChange={(e) => setRollbackReason(e.target.value)} required rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsRollbackModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending} variant="destructive">Execute Rollback</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── New Rule Modal ───────────────────────────────────────── */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-bold">New Scoring Rule</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsRuleModalOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Trigger</label>
                <select value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs">
                  <option value="task_completed">Task Completed</option>
                  <option value="attendance_scanned">Attendance Scanned</option>
                  <option value="event_participated">Event Participated</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Category</label>
                <input type="text" value={ruleCategory} onChange={(e) => setRuleCategory(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Points</label>
                <input type="number" value={rulePoints} onChange={(e) => setRulePoints(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Description</label>
                <input type="text" value={ruleDescription} onChange={(e) => setRuleDescription(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsRuleModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 text-white">Create Rule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
