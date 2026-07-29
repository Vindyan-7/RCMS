"use client";

/**
 * Points Engine & Gamification Platform Client Component
 */

import { useState, useTransition } from "react";
import {
  awardPointsAction,
  deductPointsAction,
  rollbackTransactionAction,
  createPointRuleAction,
  getLeaderboardAction,
} from "@/actions/points";
import { LeaderboardItem } from "@/repositories/points";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  Trophy,
  Star,
  ShieldAlert,
  Plus,
  RotateCcw,
  RefreshCw,
  Search,
  X,
  TrendingUp,
  Sliders,
  CheckCircle,
  Zap,
} from "lucide-react";

interface PointsClientProps {
  initialLeaderboard: LeaderboardItem[];
}

export function PointsClient({ initialLeaderboard }: PointsClientProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>(initialLeaderboard);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"leaderboard" | "rules" | "tiers">("leaderboard");

  // Modals
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Form Fields
  const [targetMemberId, setTargetMemberId] = useState("");
  const [pointsAmount, setPointsAmount] = useState(25);
  const [category, setCategory] = useState("task");
  const [remarks, setRemarks] = useState("");
  const [txId, setTxId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");

  // Rule Form Fields
  const [ruleTrigger, setRuleTrigger] = useState("task_completed");
  const [ruleCategory, setRuleCategory] = useState("task");
  const [rulePoints, setRulePoints] = useState(20);
  const [ruleDescription, setRuleDescription] = useState("");

  const filteredLeaderboard = leaderboard.filter(
    (item) =>
      item.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.rollNumber && item.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const refreshLeaderboard = async () => {
    startTransition(async () => {
      const res = await getLeaderboardAction();
      if (res.success && res.data) {
        setLeaderboard(res.data.items);
      }
    });
  };

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await awardPointsAction({
        memberId: targetMemberId,
        category,
        points: pointsAmount,
        remarks: remarks || "Manual award entry",
      });

      if (res.success) {
        alert(`Successfully awarded ${pointsAmount} points!`);
        setIsAwardModalOpen(false);
        setTargetMemberId("");
        setRemarks("");
        refreshLeaderboard();
      } else {
        alert(res.error?.message || "Award failed");
      }
    });
  };

  const handleDeductPoints = async () => {
    if (!targetMemberId) {
      alert("Please specify member ID");
      return;
    }
    startTransition(async () => {
      const res = await deductPointsAction({
        memberId: targetMemberId,
        category: "penalty",
        points: pointsAmount,
        remarks: remarks || "Penalty deduction",
      });

      if (res.success) {
        alert(`Deducted ${pointsAmount} points successfully.`);
        setIsAwardModalOpen(false);
        setTargetMemberId("");
        setRemarks("");
        refreshLeaderboard();
      } else {
        alert(res.error?.message || "Deduction failed");
      }
    });
  };

  const handleRollback = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await rollbackTransactionAction({
        transactionId: txId,
        reason: rollbackReason,
      });

      if (res.success) {
        alert("Transaction rollback entry recorded!");
        setIsRollbackModalOpen(false);
        setTxId("");
        setRollbackReason("");
        refreshLeaderboard();
      } else {
        alert(res.error?.message || "Rollback failed");
      }
    });
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPointRuleAction({
        trigger: ruleTrigger,
        category: ruleCategory,
        points: rulePoints,
        description: ruleDescription || "Automated rule",
      });

      if (res.success) {
        alert("Scoring rule created and active!");
        setIsRuleModalOpen(false);
      } else {
        alert(res.error?.message || "Failed to create rule");
      }
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Controls Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-3 border-b border-border text-sm font-semibold">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "leaderboard" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Leaderboard Rankings</span>
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "rules" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Scoring Rules Engine</span>
          </button>
          <button
            onClick={() => setActiveTab("tiers")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "tiers" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Star className="h-4 w-4" />
            <span>Achievement Tiers</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={refreshLeaderboard} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" className="flex items-center space-x-2" onClick={() => setIsRollbackModalOpen(true)}>
            <RotateCcw className="h-4 w-4" />
            <span>Rollback Transaction</span>
          </Button>
          <Button className="flex items-center space-x-2" onClick={() => setIsAwardModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Award / Adjust Points</span>
          </Button>
        </div>
      </div>

      {/* Leaderboard View */}
      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 w-full max-w-sm rounded-lg border border-input bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search leaderboard by member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-foreground"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Rank</th>
                  <th className="px-6 py-3.5">Member Name</th>
                  <th className="px-6 py-3.5">Roll Number</th>
                  <th className="px-6 py-3.5">Total Points</th>
                  <th className="px-6 py-3.5">Badge Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeaderboard.map((item, idx) => (
                  <tr key={item.memberId} className="hover:bg-accent/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary flex items-center space-x-2">
                      {idx === 0 && <Trophy className="h-4 w-4 text-amber-400" />}
                      {idx === 1 && <Trophy className="h-4 w-4 text-slate-300" />}
                      {idx === 2 && <Trophy className="h-4 w-4 text-amber-600" />}
                      <span>#{idx + 1}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{item.memberName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {item.rollNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-500">{item.totalPoints} Pts</td>
                    <td className="px-6 py-4">
                      <Badge variant={item.totalPoints >= 100 ? "success" : "secondary"}>
                        {item.totalPoints >= 200
                          ? "Diamond Master"
                          : item.totalPoints >= 100
                          ? "Gold Achiever"
                          : "Silver Contributor"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scoring Rules View */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground text-sm">Active Rules Registry</h3>
            <Button size="sm" onClick={() => setIsRuleModalOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Rule
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground text-sm">Session Attendance Rule</span>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Trigger: attendance_marked | Category: attendance</p>
              <div className="text-xs font-bold text-emerald-500">+10 Points Awarded</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground text-sm">Technical Task Completion</span>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Trigger: task_completed | Category: task</p>
              <div className="text-xs font-bold text-emerald-500">+15 - +50 Points Awarded</div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Tiers View */}
      {activeTab === "tiers" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center space-x-2 text-amber-500 font-bold">
              <Star className="h-5 w-5 fill-current" />
              <span>Bronze Tier</span>
            </div>
            <div className="text-2xl font-bold text-foreground">0 - 49 Pts</div>
            <p className="text-xs text-muted-foreground">Entry-level club member badge unlock.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center space-x-2 text-slate-300 font-bold">
              <Star className="h-5 w-5 fill-current" />
              <span>Silver Tier</span>
            </div>
            <div className="text-2xl font-bold text-foreground">50 - 99 Pts</div>
            <p className="text-xs text-muted-foreground">Active contributor badge unlock.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Star className="h-5 w-5 fill-current" />
              <span>Gold Tier</span>
            </div>
            <div className="text-2xl font-bold text-foreground">100+ Pts</div>
            <p className="text-xs text-muted-foreground">Elite robotics engineer badge unlock.</p>
          </div>
        </div>
      )}

      {/* Award Points Modal */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Manual Points Adjustment</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAwardModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleAwardPoints} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Member UUID</label>
                <input
                  type="text"
                  required
                  value={targetMemberId}
                  placeholder="Paste Member ID..."
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="attendance">Attendance</option>
                    <option value="task">Task</option>
                    <option value="event">Event</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Points Value</label>
                  <input
                    type="number"
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Audit Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  placeholder="Reason for adjustment..."
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Processing..." : "Award Points"}
                </Button>
                <Button type="button" variant="destructive" className="w-full" onClick={handleDeductPoints} disabled={isPending}>
                  Deduct Penalty
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rollback Modal */}
      {isRollbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Rollback Ledger Transaction</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsRollbackModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleRollback} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Original Transaction UUID</label>
                <input
                  type="text"
                  required
                  value={txId}
                  placeholder="Paste transaction UUID..."
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Rollback Reason</label>
                <input
                  type="text"
                  required
                  value={rollbackReason}
                  placeholder="Reason for reversal..."
                  onChange={(e) => setRollbackReason(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Reversing..." : "Execute Reversal Posting"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Create Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Create Scoring Rule</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsRuleModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Rule Trigger</label>
                <input
                  type="text"
                  required
                  value={ruleTrigger}
                  onChange={(e) => setRuleTrigger(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Category</label>
                  <input
                    type="text"
                    required
                    value={ruleCategory}
                    onChange={(e) => setRuleCategory(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Points</label>
                  <input
                    type="number"
                    required
                    value={rulePoints}
                    onChange={(e) => setRulePoints(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating Rule..." : "Save Rule"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
