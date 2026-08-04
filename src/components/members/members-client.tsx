"use client";

/**
 * Members Domain - Members Directory & Central Member Intelligence Workspace Component
 * Production Polish: Single consolidated fetch, full lifecycle timeline, 7 tabs, zero UUIDs, enriched CSV exports
 */

import { useState, useRef, useTransition, useEffect, useCallback } from "react";
import {
  registerMemberAction,
  updateMemberAction,
  archiveMemberAction,
  searchMembersAction,
  importMembersCsvAction,
  getMemberWorkspaceDataAction,
  exportMemberTimelineCsvAction,
} from "@/actions/members/members.actions";
import { renewMembershipAction } from "@/actions/members/memberships.actions";
import { MemberSelect } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  Calendar,
  User,
  GraduationCap,
  ShieldAlert,
  ArrowUpRight,
  Zap,
  CheckSquare,
  Award,
  Clock,
  History,
  TrendingUp,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Info,
  Trophy,
} from "lucide-react";

interface MembersClientProps {
  initialMembers: MemberSelect[];
}

export function MembersClient({ initialMembers }: MembersClientProps) {
  const [members, setMembers] = useState<MemberSelect[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Member Workspace State
  const [activeWorkspaceMember, setActiveWorkspaceMember] = useState<MemberSelect | null>(null);
  const [workspaceData, setWorkspaceData] = useState<any | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<"timeline" | "attendance" | "tasks" | "events" | "points" | "history" | "profile">("timeline");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSelect | null>(null);

  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [branch, setBranch] = useState("ECE");
  const [year, setYear] = useState<number>(1);
  const [gender, setGender] = useState("male");
  const [role, setRole] = useState("member");

  const handleRefresh = useCallback(async () => {
    startTransition(async () => {
      const res = await searchMembersAction("", { limit: 1000 });
      if (res.success && res.data) {
        setMembers(res.data.items);
      }
    });
  }, []);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Open Consolidated Member Workspace
  const handleOpenMemberWorkspace = async (member: MemberSelect) => {
    setActiveWorkspaceMember(member);
    setIsWorkspaceLoading(true);
    setWorkspaceTab("timeline");
    try {
      const res = await getMemberWorkspaceDataAction(member.id);
      if (res.success && res.data) {
        setWorkspaceData(res.data);
      } else {
        setWorkspaceData(null);
      }
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleRenewMemberWorkspace = async (memberId: string) => {
    startTransition(async () => {
      const res = await renewMembershipAction(memberId);
      if (res.success) {
        alert("Membership renewed successfully into active semester!");
        if (activeWorkspaceMember) handleOpenMemberWorkspace(activeWorkspaceMember);
        handleRefresh();
      } else {
        alert(res.error?.message || "Failed to renew membership");
      }
    });
  };

  const handleExportTimelineCsv = async (memberId: string) => {
    startTransition(async () => {
      const res = await exportMemberTimelineCsvAction(memberId);
      if (res.success && res.data) {
        const blob = new Blob([res.data.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", res.data.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(res.error?.message || "Failed to export timeline CSV");
      }
    });
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.rollNumber?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.clubMembershipId?.toLowerCase().includes(q) ||
      m.memberId?.toLowerCase().includes(q);

    const matchBranch = branchFilter === "all" || (m.branch || "").toLowerCase() === branchFilter.toLowerCase();
    const matchYear = yearFilter === "all" || String(m.year || 1) === yearFilter;
    const matchGender = genderFilter === "all" || (m.gender || "").toLowerCase() === genderFilter.toLowerCase();
    const matchRole = roleFilter === "all" || (m.role || "member").toLowerCase() === roleFilter.toLowerCase();
    const matchStatus = statusFilter === "all" || (m.status || "active").toLowerCase() === statusFilter.toLowerCase();

    return matchQuery && matchBranch && matchYear && matchGender && matchRole && matchStatus;
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRollNumber("");
    setBranch("ECE");
    setYear(1);
    setGender("male");
    setRole("member");
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await registerMemberAction({
        name,
        email,
        phone,
        rollNumber,
        branch,
        year,
        gender,
        role,
      });

      if (res.success) {
        setIsAddModalOpen(false);
        resetForm();
        handleRefresh();
      } else {
        alert(res.error?.message || "Failed to add member");
      }
    });
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    startTransition(async () => {
      const res = await updateMemberAction(selectedMember.id, {
        name,
        email,
        phone,
        rollNumber,
        branch,
        year,
        gender,
        role,
      });

      if (res.success) {
        setIsEditModalOpen(false);
        setSelectedMember(null);
        resetForm();
        if (activeWorkspaceMember?.id === selectedMember.id) {
          handleOpenMemberWorkspace(selectedMember);
        }
        handleRefresh();
      } else {
        alert(res.error?.message || "Failed to update member");
      }
    });
  };

  const handleArchiveMember = async (id: string) => {
    if (!confirm("Are you sure you want to archive this member record?")) return;

    startTransition(async () => {
      const res = await archiveMemberAction(id);
      if (res.success) {
        handleRefresh();
      } else {
        alert(res.error?.message || "Failed to archive member");
      }
    });
  };

  const handleBulkImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const csvText = evt.target?.result as string;
      if (!csvText) return;

      startTransition(async () => {
        const res = await importMembersCsvAction(csvText);
        if (res.success && res.data) {
          alert(
            `CSV Member Import Complete!\nSuccess: ${res.data.imported} members registered.\nErrors: ${res.data.skipped} rows skipped.` +
              (res.data.errors.length > 0 ? `\n\nError Summary:\n${res.data.errors.slice(0, 5).join("\n")}` : "")
          );
          handleRefresh();
        } else {
          alert(res.error?.message || "CSV Import Failed");
        }
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMemberIds.length === filteredMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map((m) => m.id));
    }
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 text-left relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleBulkImportCsv}
        accept=".csv"
        className="hidden"
      />

      {/* Header Bar */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Members &amp; Talent Registry
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official Robotics Club Membership Directory ({filteredMembers.length} Registered Records)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isPending}
              className="flex items-center space-x-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="flex items-center space-x-1.5 text-xs"
            >
              <Upload className="h-3.5 w-3.5 text-blue-400" />
              <span>Bulk Import CSV</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Member</span>
            </Button>
          </div>
        </div>

        {/* Search & Filtering Bar */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-center">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, roll number, member ID or club ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
          >
            <option value="all">Branch: All</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
          >
            <option value="all">Year: All</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
          >
            <option value="all">Role: All</option>
            <option value="lead">Lead</option>
            <option value="core">Core</option>
            <option value="member">Member</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-background/40">
          <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
            <thead className="border-b border-border bg-muted/30 font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
              <tr>
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.length > 0 && selectedMemberIds.length === filteredMembers.length}
                    onChange={toggleSelectAll}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3">PHOTO</th>
                <th className="px-4 py-3">CLUB MEMBERSHIP ID</th>
                <th className="px-4 py-3">NAME</th>
                <th className="px-4 py-3">ROLL NUMBER</th>
                <th className="px-4 py-3">DEPARTMENT</th>
                <th className="px-4 py-3">YEAR</th>
                <th className="px-4 py-3">ROLE</th>
                <th className="px-4 py-3">PHONE NUMBER</th>
                <th className="px-4 py-3">EMAIL</th>
                <th className="px-4 py-3">SYSTEM MEMBER ID</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-muted-foreground">
                    No members match the current search criteria or filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => handleOpenMemberWorkspace(member)}
                    className="hover:bg-accent/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(member.id)}
                        onChange={() => toggleSelectMember(member.id)}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-950/80 font-bold text-blue-400 text-xs border border-blue-800/60 shadow-sm">
                        {getInitials(member.name || "Member")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-blue-950/80 text-blue-400 border border-blue-800/50 font-mono text-[11px] px-2 py-0.5 rounded-md">
                        {member.clubMembershipId || member.memberId || "SAC-RC-0000"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground group-hover:text-blue-400 transition-colors">
                      <div className="flex items-center space-x-1">
                        <span>{member.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {member.rollNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {member.branch || "ECE"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      Yr {member.year || 1}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5">
                        {member.role || "Member"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.phone}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-slate-900 text-slate-300 border border-slate-700 font-mono text-[11px] px-2 py-0.5 rounded-md">
                        {member.memberId || "MEM-2026-0000"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={member.status === "active" ? "success" : "secondary"} className="capitalize">
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setSelectedMember(member);
                          setName(member.name);
                          setEmail(member.email);
                          setPhone(member.phone);
                          setRollNumber(member.rollNumber);
                          setBranch(member.branch || "ECE");
                          setYear(member.year || 1);
                          setGender(member.gender || "male");
                          setRole(member.role || "member");
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleArchiveMember(member.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CONSOLIDATED MEMBER WORKSPACE SLIDE-OVER PANEL ──────────────────── */}
      {activeWorkspaceMember && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-card border-l border-border h-full overflow-y-auto p-6 shadow-2xl space-y-6 animate-in slide-in-from-right duration-200">
            
            {/* 1. Workspace Header */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div className="flex items-center space-x-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950 text-blue-400 font-bold text-lg border border-blue-800/60 shadow-md">
                  {getInitials(activeWorkspaceMember.name || "Member")}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-foreground">{activeWorkspaceMember.name}</h2>
                    <Badge variant={workspaceData?.membershipStatus === "active" ? "success" : "secondary"} className="capitalize text-xs">
                      {workspaceData?.membershipStatus || activeWorkspaceMember.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono flex-wrap">
                    <span className="text-blue-400 font-bold">{activeWorkspaceMember.clubMembershipId || activeWorkspaceMember.memberId || "SAC-RC-0000"}</span>
                    <span>•</span>
                    <span>Roll: {activeWorkspaceMember.rollNumber}</span>
                    <span>•</span>
                    <span>{activeWorkspaceMember.branch || "ECE"} (Yr {activeWorkspaceMember.year || 1})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleRenewMemberWorkspace(activeWorkspaceMember.id)}
                  disabled={isPending}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Renew Membership
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportTimelineCsv(activeWorkspaceMember.id)}
                  disabled={isPending}
                  className="text-xs border-border bg-card gap-1"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" /> Export CSV
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setActiveWorkspaceMember(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* 2. Summary Statistics Grid (8 Metrics Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-2.5 text-center space-y-0.5">
                <div className="text-[9px] font-bold text-emerald-400 uppercase">Points</div>
                <div className="text-base font-bold text-emerald-300">{workspaceData?.totalPoints ?? 0}</div>
              </div>
              <div className="rounded-xl border border-blue-800/40 bg-blue-950/20 p-2.5 text-center space-y-0.5">
                <div className="text-[9px] font-bold text-blue-400 uppercase">Attendance</div>
                <div className="text-base font-bold text-blue-300">{workspaceData?.attendanceRate ?? 0}%</div>
              </div>
              <div className="rounded-xl border border-purple-800/40 bg-purple-950/20 p-2.5 text-center space-y-0.5">
                <div className="text-[9px] font-bold text-purple-400 uppercase">Tasks</div>
                <div className="text-base font-bold text-purple-300">{workspaceData?.tasksCompletedCount ?? 0}</div>
              </div>
              <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-2.5 text-center space-y-0.5">
                <div className="text-[9px] font-bold text-amber-400 uppercase">Events</div>
                <div className="text-base font-bold text-amber-300">{workspaceData?.eventsParticipatedCount ?? 0}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-center space-y-0.5">
                <div className="text-[9px] font-bold text-muted-foreground uppercase">Sessions</div>
                <div className="text-base font-bold text-foreground">{workspaceData?.presentCount ?? 0}/{workspaceData?.totalSessionsCount ?? 0}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-center space-y-0.5">
                <div className="text-[9px] font-bold text-muted-foreground uppercase">Rank</div>
                <div className="text-base font-bold text-amber-400">#{workspaceData?.leaderboardRank ?? 1}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-center space-y-0.5">
                <div className="text-[9px] font-bold text-muted-foreground uppercase">Renewals</div>
                <div className="text-base font-bold text-foreground">{workspaceData?.membershipHistory?.length ?? 1}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-center space-y-0.5">
                <div className="text-[9px] font-bold text-muted-foreground uppercase">Semester</div>
                <div className="text-[11px] font-bold text-blue-400 truncate">{workspaceData?.activeSemesterName || "B1"}</div>
              </div>
            </div>

            {/* 3. Workspace Tab Navigation */}
            <div className="flex border-b border-border/70 overflow-x-auto text-xs font-semibold">
              {(["timeline", "attendance", "tasks", "events", "points", "history", "profile"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setWorkspaceTab(t)}
                  className={`pb-2.5 px-3 capitalize whitespace-nowrap transition-colors border-b-2 ${
                    workspaceTab === t ? "border-blue-500 text-blue-400 font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "timeline" && "Chronological Timeline"}
                  {t === "attendance" && `Attendance (${workspaceData?.attendance?.length ?? 0})`}
                  {t === "tasks" && `Technical Tasks (${workspaceData?.tasks?.length ?? 0})`}
                  {t === "events" && `Events (${workspaceData?.events?.length ?? 0})`}
                  {t === "points" && "Points Ledger"}
                  {t === "history" && "Membership History"}
                  {t === "profile" && "Member Profile"}
                </button>
              ))}
            </div>

            {/* 4. Tab Content */}
            {isWorkspaceLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading member workspace intelligence...
              </div>
            ) : !workspaceData ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Failed to load member intelligence data.</div>
            ) : (
              <div className="space-y-4">
                {/* ── TIMELINE TAB ──────────────────────────────────────────────── */}
                {workspaceTab === "timeline" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <History className="h-4 w-4 text-blue-400" /> Chronological Member Activity Feed (Newest First)
                    </h3>
                    {workspaceData.timeline.length === 0 ? (
                      <div className="p-6 rounded-xl border border-border bg-muted/20 text-center text-xs text-muted-foreground">
                        No activity records logged for this member yet.
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-4 border-l border-border/60">
                        {workspaceData.timeline.map((item: any) => (
                          <div key={item.id} className="relative group">
                            <div className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 bg-card ${
                              item.type === "attendance" ? "border-emerald-500" :
                              item.type === "task" ? "border-blue-500" :
                              item.type === "event" ? "border-amber-500" :
                              item.type === "points" ? "border-purple-500" : "border-slate-500"
                            }`} />
                            <div className="rounded-xl border border-border/50 bg-card p-3.5 shadow-sm space-y-1">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-xs text-foreground">{item.title}</span>
                                <span className="font-bold text-xs text-emerald-400">{item.points}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">{item.details}</p>
                              <div className="text-[10px] font-mono text-muted-foreground/60 pt-0.5">
                                {new Date(item.date).toLocaleString("en-IN")}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── ATTENDANCE TAB ────────────────────────────────────────────── */}
                {workspaceTab === "attendance" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-muted/10 p-3 flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-semibold">Attendance Overview</span>
                      <div className="flex items-center gap-4">
                        <span className="text-emerald-400 font-bold">Present: {workspaceData.presentCount}</span>
                        <span className="text-amber-400 font-bold">Late: {workspaceData.lateCount}</span>
                        <span className="text-red-400 font-bold">Absent: {workspaceData.absentCount}</span>
                        <span className="text-blue-400 font-bold">Rate: {workspaceData.attendanceRate}%</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
                        <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2.5">SESSION TITLE</th>
                            <th className="px-3 py-2.5">DATE</th>
                            <th className="px-3 py-2.5">STATUS</th>
                            <th className="px-3 py-2.5">LATE</th>
                            <th className="px-3 py-2.5">POINTS</th>
                            <th className="px-3 py-2.5">METHOD</th>
                            <th className="px-3 py-2.5">VOLUNTEER</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {workspaceData.attendance.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No attendance records.</td></tr>
                          ) : (
                            workspaceData.attendance.map((a: any) => (
                              <tr key={a.id} className="hover:bg-accent/30 transition-colors">
                                <td className="px-3 py-2.5 font-semibold">{a.sessionTitle}</td>
                                <td className="px-3 py-2.5 text-muted-foreground">{new Date(a.sessionDate).toLocaleDateString("en-IN")}</td>
                                <td className="px-3 py-2.5"><Badge variant="success" className="text-[10px]">{a.status}</Badge></td>
                                <td className="px-3 py-2.5"><Badge variant={a.late ? "destructive" : "outline"} className="text-[10px]">{a.late ? "Late" : "On Time"}</Badge></td>
                                <td className="px-3 py-2.5 font-bold text-emerald-400">+{a.points} Pts</td>
                                <td className="px-3 py-2.5 capitalize text-muted-foreground">{a.method}</td>
                                <td className="px-3 py-2.5 text-muted-foreground text-[11px]">{a.volunteerName}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TECHNICAL TASKS TAB ───────────────────────────────────────── */}
                {workspaceTab === "tasks" && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
                        <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2.5">TASK TITLE</th>
                            <th className="px-3 py-2.5">CATEGORY</th>
                            <th className="px-3 py-2.5">POINTS</th>
                            <th className="px-3 py-2.5">COMPLETION DATE</th>
                            <th className="px-3 py-2.5">VERIFIER</th>
                            <th className="px-3 py-2.5">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {workspaceData.tasks.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No tasks completed yet.</td></tr>
                          ) : (
                            workspaceData.tasks.map((t: any) => (
                              <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                                <td className="px-3 py-2.5 font-semibold">{t.title}</td>
                                <td className="px-3 py-2.5"><Badge variant="outline" className="text-[10px]">{t.category}</Badge></td>
                                <td className="px-3 py-2.5 font-bold text-emerald-400">+{t.points} Pts</td>
                                <td className="px-3 py-2.5 text-muted-foreground">{new Date(t.completionDate).toLocaleString("en-IN")}</td>
                                <td className="px-3 py-2.5 text-muted-foreground text-[11px]">{t.verifierName}</td>
                                <td className="px-3 py-2.5"><Badge variant="success" className="text-[10px]">{t.status}</Badge></td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── EVENTS TAB ────────────────────────────────────────────────── */}
                {workspaceTab === "events" && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
                        <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2.5">EVENT NAME</th>
                            <th className="px-3 py-2.5">VENUE</th>
                            <th className="px-3 py-2.5">START DATE</th>
                            <th className="px-3 py-2.5">PARTICIPATION</th>
                            <th className="px-3 py-2.5">VERIFICATION</th>
                            <th className="px-3 py-2.5">POINTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {workspaceData.events.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No event participations.</td></tr>
                          ) : (
                            workspaceData.events.map((e: any) => (
                              <tr key={e.id} className="hover:bg-accent/30 transition-colors">
                                <td className="px-3 py-2.5 font-semibold">{e.eventName}</td>
                                <td className="px-3 py-2.5 text-muted-foreground">{e.venue}</td>
                                <td className="px-3 py-2.5 text-muted-foreground">{new Date(e.startDate).toLocaleDateString("en-IN")}</td>
                                <td className="px-3 py-2.5 text-muted-foreground">{e.participationStatus}</td>
                                <td className="px-3 py-2.5"><Badge variant={e.verificationStatus === "Verified" ? "success" : "secondary"} className="text-[10px]">{e.verificationStatus}</Badge></td>
                                <td className="px-3 py-2.5 font-bold text-emerald-400">+{e.points} Pts</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── POINTS LEDGER TAB ─────────────────────────────────────────── */}
                {workspaceTab === "points" && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
                        <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2.5">DATE</th>
                            <th className="px-3 py-2.5">REASON</th>
                            <th className="px-3 py-2.5">CATEGORY</th>
                            <th className="px-3 py-2.5">POINTS</th>
                            <th className="px-3 py-2.5">VERIFIER</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {workspaceData.pointsLedger.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No ledger transactions logged.</td></tr>
                          ) : (
                            workspaceData.pointsLedger.map((l: any) => (
                              <tr key={l.id} className="hover:bg-accent/30 transition-colors">
                                <td className="px-3 py-2.5 text-muted-foreground">{new Date(l.date).toLocaleString("en-IN")}</td>
                                <td className="px-3 py-2.5 font-medium">{l.remarks}</td>
                                <td className="px-3 py-2.5"><Badge variant="outline" className="text-[10px]">{l.category}</Badge></td>
                                <td className="px-3 py-2.5 font-bold text-emerald-400">{l.points >= 0 ? `+${l.points}` : l.points} Pts</td>
                                <td className="px-3 py-2.5 text-muted-foreground text-[11px]">{l.verifierName}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── MEMBERSHIP HISTORY TAB ────────────────────────────────────── */}
                {workspaceTab === "history" && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
                        <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2.5">SEMESTER</th>
                            <th className="px-3 py-2.5">ACADEMIC YEAR</th>
                            <th className="px-3 py-2.5">MEMBERSHIP ID</th>
                            <th className="px-3 py-2.5">JOINED DATE</th>
                            <th className="px-3 py-2.5">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {workspaceData.membershipHistory.map((m: any) => (
                            <tr key={m.id} className="hover:bg-accent/30 transition-colors">
                              <td className="px-3 py-2.5 font-bold text-foreground">{m.semesterName}</td>
                              <td className="px-3 py-2.5 text-muted-foreground">{m.academicYearName}</td>
                              <td className="px-3 py-2.5 font-mono text-[11px] text-blue-300">{m.membershipId}</td>
                              <td className="px-3 py-2.5 text-muted-foreground">{new Date(m.joinDate).toLocaleDateString("en-IN")}</td>
                              <td className="px-3 py-2.5"><Badge variant={m.status === "active" ? "success" : "secondary"} className="text-[10px]">{m.status}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── MEMBER PROFILE TAB ────────────────────────────────────────── */}
                {workspaceTab === "profile" && (
                  <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <User className="h-4 w-4 text-blue-400" /> Member Personal Profile Details
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Full Name</span>
                        <span className="font-semibold text-foreground">{activeWorkspaceMember.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Club Membership ID</span>
                        <span className="font-mono text-blue-300 font-semibold">{activeWorkspaceMember.clubMembershipId || activeWorkspaceMember.memberId || "SAC-RC-0000"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">System Member ID</span>
                        <span className="font-mono text-slate-300">{activeWorkspaceMember.memberId || "MEM-2026-0000"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Roll Number</span>
                        <span className="font-mono text-foreground">{activeWorkspaceMember.rollNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Department / Branch</span>
                        <span className="font-semibold">{activeWorkspaceMember.branch || "ECE"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Year of Study</span>
                        <span>Yr {activeWorkspaceMember.year || 1}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Email Address</span>
                        <span className="text-muted-foreground">{activeWorkspaceMember.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Phone Number</span>
                        <span className="text-muted-foreground">{activeWorkspaceMember.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">Gender</span>
                        <span className="capitalize">{activeWorkspaceMember.gender || "Other"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Register New Member</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3 text-left text-xs">
              <div>
                <label className="font-semibold block mb-1">Full Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Roll Number *</label>
                  <input type="text" required value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Branch *</label>
                  <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs">
                    <option value="ECE">ECE</option>
                    <option value="CSE">CSE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Email *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Phone *</label>
                  <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Year *</label>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs">
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Gender *</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold pt-2">
                {isPending ? "Registering..." : "Complete Registration"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Edit Member Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleEditMember} className="space-y-3 text-left text-xs">
              <div>
                <label className="font-semibold block mb-1">Full Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Roll Number *</label>
                  <input type="text" required value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Branch *</label>
                  <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs">
                    <option value="ECE">ECE</option>
                    <option value="CSE">CSE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Email *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Phone *</label>
                  <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs" />
                </div>
              </div>
              <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold pt-2">
                {isPending ? "Saving..." : "Save Member Changes"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
