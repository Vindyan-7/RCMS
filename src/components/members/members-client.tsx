"use client";

/**
 * Members Domain - Members & Talent Registry Management System
 */

import { useState, useTransition, useEffect, useRef } from "react";
import {
  registerMemberAction,
  updateMemberAction,
  archiveMemberAction,
  searchMembersAction,
  importMembersCsvAction,
  bulkRenewMembershipsAction,
} from "@/actions/members";
import { awardPointsAction, getMemberScoreAction } from "@/actions/points";
import { sendNotificationAction } from "@/actions/communication";
import { requestBorrowingAction } from "@/actions/inventory";
import { MemberSelect } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  User,
  X,
  Award,
  Box,
  MessageSquare,
  Activity,
  ArrowUpRight,
  RotateCcw,
  CheckSquare,
} from "lucide-react";

interface MembersClientProps {
  initialMembers: MemberSelect[];
}

export function MembersClient({ initialMembers }: MembersClientProps) {
  const [membersList, setMembersList] = useState<MemberSelect[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Filter States
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal controllers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState<MemberSelect | null>(null);
  const [memberScore, setMemberScore] = useState<{ totalPoints: number } | null>(null);

  // Quick Action form controller
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);
  const [pointsAmount, setPointsAmount] = useState(10);
  const [pointsCategory, setPointsCategory] = useState("participation");
  const [actionRemarks, setActionRemarks] = useState("");
  const [borrowItemId, setBorrowItemId] = useState("");
  const [notificationMsg, setNotificationMsg] = useState("");

  const [activeTab, setActiveTab] = useState("profile");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields for Add/Edit
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [memberId, setMemberId] = useState("");
  const [clubMembershipId, setClubMembershipId] = useState("");
  const [branch, setBranch] = useState("ECE");
  const [gender, setGender] = useState("male");
  const [year, setYear] = useState(1);
  const [role, setRole] = useState("Member");
  const [status, setStatus] = useState("active");

  // Fetch score when member selected
  useEffect(() => {
    if (selectedMember) {
      getMemberScoreAction(selectedMember.id).then((res) => {
        if (res.success && res.data) {
          setMemberScore(res.data);
        }
      });
    } else {
      setMemberScore(null);
    }
  }, [selectedMember]);

  const filteredMembers = membersList.filter((m) => {
    const queryLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      m.name?.toLowerCase().includes(queryLower) ||
      m.rollNumber?.toLowerCase().includes(queryLower) ||
      m.email?.toLowerCase().includes(queryLower) ||
      m.memberId?.toLowerCase().includes(queryLower) ||
      m.clubMembershipId?.toLowerCase().includes(queryLower) ||
      m.phone?.toLowerCase().includes(queryLower) ||
      m.branch?.toLowerCase().includes(queryLower);

    const matchesBranch = branchFilter === "all" || (m.branch || "ECE") === branchFilter;
    const matchesYear = yearFilter === "all" || String(m.year || 1) === yearFilter;
    const matchesGender = genderFilter === "all" || (m.gender || "male").toLowerCase() === genderFilter.toLowerCase();
    const matchesRole = roleFilter === "all" || (m.role || "Member").toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;

    return matchesSearch && matchesBranch && matchesYear && matchesGender && matchesRole && matchesStatus;
  });

  const handleRefresh = async () => {
    startTransition(async () => {
      const res = await searchMembersAction("", { limit: 1000 });
      if (res.success && res.data) {
        setMembersList(res.data.items);
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map((m) => m.id));
    }
  };

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleBulkRenew = async () => {
    if (selectedMemberIds.length === 0) return;
    if (!confirm(`Renew membership into Active Semester for ${selectedMemberIds.length} selected member(s)?`)) return;

    startTransition(async () => {
      const res = await bulkRenewMembershipsAction(selectedMemberIds);
      if (res.success && res.data) {
        alert(`Bulk Renewal Result:\n• ${res.data.renewedCount} member(s) renewed into active semester "${res.data.activeSemesterName}"\n• ${res.data.skippedCount} member(s) already active in current semester`);
        setSelectedMemberIds([]);
        handleRefresh();
      } else {
        alert(res.error?.message || "Failed to renew memberships.");
      }
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await registerMemberAction({
        name,
        email,
        phone,
        rollNumber,
        memberId: memberId || undefined,
        clubMembershipId: clubMembershipId || undefined,
        branch,
        gender,
        year,
        role,
        status,
      });

      if (res.success && res.data) {
        setIsAddModalOpen(false);
        resetForm();
        handleRefresh();
      } else {
        alert(res.error?.message || "Registration failed");
      }
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    startTransition(async () => {
      const res = await updateMemberAction(selectedMember.id, {
        name,
        email,
        phone,
        rollNumber,
        branch,
        gender,
        year,
        role,
        status,
      });

      if (res.success && res.data) {
        setIsEditModalOpen(false);
        setSelectedMember(null);
        handleRefresh();
      } else {
        alert(res.error?.message || "Update failed");
      }
    });
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this member?")) return;

    startTransition(async () => {
      const res = await archiveMemberAction(id);
      if (res.success) {
        handleRefresh();
      } else {
        alert(res.error?.message || "Archive failed");
      }
    });
  };

  const handleBulkImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvContent = event.target?.result as string;
      if (!csvContent) return;

      startTransition(async () => {
        const res = await importMembersCsvAction(csvContent);
        if (res.success && res.data) {
          const errList = res.data.errors.length > 0 
            ? `\n\nError Summary (${res.data.errors.length}):\n` + res.data.errors.slice(0, 5).join("\n") + (res.data.errors.length > 5 ? `\n...and ${res.data.errors.length - 5} more` : "")
            : "";
          alert(`CSV Import Completed!\n\n✅ Successfully Imported: ${res.data.imported} members\n⚠️ Skipped/Failed: ${res.data.skipped}${errList}`);
          handleRefresh();
        } else {
          alert("CSV Import Failed: " + (res.error?.message || "Invalid file format or unauthorized access"));
        }
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    startTransition(async () => {
      const res = await awardPointsAction({
        memberId: selectedMember.id,
        category: pointsCategory,
        points: pointsAmount,
        remarks: actionRemarks || "Awarded via Members Workspace",
      });

      if (res.success) {
        alert(`Successfully awarded ${pointsAmount} points!`);
        setActiveQuickAction(null);
        setActionRemarks("");
        const scoreRes = await getMemberScoreAction(selectedMember.id);
        if (scoreRes.success && scoreRes.data) {
          setMemberScore(scoreRes.data);
        }
      } else {
        alert(res.error?.message || "Failed to award points");
      }
    });
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    startTransition(async () => {
      const res = await sendNotificationAction({
        recipientId: selectedMember.id,
        title: "Workspace Announcement",
        message: notificationMsg,
        channel: "in_app",
      });

      if (res.success) {
        alert("Notification dispatched successfully!");
        setActiveQuickAction(null);
        setNotificationMsg("");
      } else {
        alert(res.error?.message || "Failed to dispatch notification");
      }
    });
  };

  const handleRequestBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    startTransition(async () => {
      const res = await requestBorrowingAction({
        memberId: selectedMember.id,
        itemId: borrowItemId,
        quantity: 1,
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (res.success) {
        alert("Borrowing request registered successfully!");
        setActiveQuickAction(null);
        setBorrowItemId("");
      } else {
        alert(res.error?.message || "Failed to borrow equipment");
      }
    });
  };

  const handleExport = () => {
    const headers = [
      "Club Membership ID",
      "Name",
      "Roll Number",
      "Branch",
      "Year",
      "Role",
      "Phone",
      "Email",
      "Internal Member ID",
      "Status",
    ];
    const rows = filteredMembers.map((m) => [
      `"${m.clubMembershipId || ""}"`,
      `"${m.name || ""}"`,
      `"${m.rollNumber || ""}"`,
      `"${m.branch || "ECE"}"`,
      `"Yr ${m.year || 1}"`,
      `"${m.role || "Member"}"`,
      `"${m.phone || ""}"`,
      `"${m.email || ""}"`,
      `"${m.memberId || ""}"`,
      `"${m.status || "active"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RCMS_Members_Directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRollNumber("");
    setMemberId("");
    setClubMembershipId("");
    setBranch("ECE");
    setGender("male");
    setYear(1);
    setRole("Member");
    setStatus("active");
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Bulk CSV Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleBulkImportCsv}
        accept=".csv"
        className="hidden"
      />

      {/* Outer Card Header matching Screenshot 2 */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Members & Talent Registry
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
              <Upload className="h-3.5 w-3.5" />
              <span>Bulk Import CSV</span>
            </Button>



            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center space-x-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Member</span>
            </Button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Name, Roll Number, Email, Member ID, Club Membership ID, Phone, Branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-input bg-background/60 pl-10 pr-4 py-2.5 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Multi-Column Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 text-xs border-t border-border/40 pt-4">
          <span className="font-semibold text-muted-foreground flex items-center space-x-1">
            <span>Filters:</span>
          </span>

          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground font-medium">Branch:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none"
            >
              <option value="all">All</option>
              <option value="CSM">CSM</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="CSE">CSE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="INF">INF</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground font-medium">Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none"
            >
              <option value="all">All</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground font-medium">Gender:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none"
            >
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none"
            >
              <option value="all">All</option>
              <option value="lead">Lead</option>
              <option value="core">Core</option>
              <option value="member">Member</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:border-primary focus:outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Directory Table Matching Screenshot 2 */}
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
                <th className="px-4 py-3">INTERNAL MEMBER ID</th>
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
                  <tr key={member.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(member.id)}
                        onChange={() => toggleSelectMember(member.id)}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                    </td>
                    {/* PHOTO Avatar Badge */}
                    <td className="px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-950/80 font-bold text-blue-400 text-xs border border-blue-800/60 shadow-sm">
                        {getInitials(member.name || "Member")}
                      </div>
                    </td>

                    {/* CLUB MEMBERSHIP ID Pill */}
                    <td className="px-4 py-3">
                      <Badge className="bg-blue-950/80 text-blue-400 border border-blue-800/50 font-mono text-[11px] px-2 py-0.5 rounded-md">
                        {member.clubMembershipId || member.memberId || "SAC-RC-000000"}
                      </Badge>
                    </td>

                    {/* NAME */}
                    <td
                      className="px-4 py-3 font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        setSelectedMember(member);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{member.name}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-60" />
                      </div>
                    </td>

                    {/* ROLL NUMBER */}
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {member.rollNumber}
                    </td>

                    {/* DEPARTMENT / BRANCH */}
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {member.branch || "ECE"}
                    </td>

                    {/* YEAR */}
                    <td className="px-4 py-3 text-muted-foreground">
                      Yr {member.year || 1}
                    </td>

                    {/* ROLE */}
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5">
                        {member.role || "Member"}
                      </Badge>
                    </td>

                    {/* PHONE NUMBER */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.phone}
                    </td>

                    {/* EMAIL */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.email}
                    </td>

                    {/* INTERNAL MEMBER ID */}
                    <td className="px-4 py-3">
                      <Badge className="bg-slate-900 text-slate-300 border border-slate-700 font-mono text-[11px] px-2 py-0.5 rounded-md">
                        {member.memberId || "MEM-2026-0000"}
                      </Badge>
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3">
                      <Badge variant={member.status === "active" ? "success" : "secondary"} className="capitalize">
                        {member.status}
                      </Badge>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 text-right space-x-1">
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
                          setMemberId(member.memberId || "");
                          setClubMembershipId(member.clubMembershipId || "");
                          setBranch(member.branch || "ECE");
                          setGender(member.gender || "male");
                          setYear(member.year || 1);
                          setRole(member.role || "Member");
                          setStatus(member.status);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleArchive(member.id)}
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

      {/* Member Details & Quick Action Modal */}
      {isDetailModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-950/80 text-blue-400 font-bold text-base border border-blue-800/60">
                  {getInitials(selectedMember.name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedMember.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Roll: {selectedMember.rollNumber} | Club ID: {selectedMember.clubMembershipId || selectedMember.memberId}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setIsDetailModalOpen(false); setSelectedMember(null); }}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-4 mt-6 overflow-y-auto flex-1 pr-1">
              <div className="space-y-4 md:col-span-1 border-r border-border pr-4 text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Action Panel</h4>
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" className="justify-start text-xs h-9" onClick={() => setActiveQuickAction("award_points")}>
                    <Award className="mr-2 h-4 w-4 text-primary" /> Award Points
                  </Button>
                  <Button variant="outline" className="justify-start text-xs h-9" onClick={() => setActiveQuickAction("borrow_equip")}>
                    <Box className="mr-2 h-4 w-4 text-primary" /> Borrow Equipment
                  </Button>
                  <Button variant="outline" className="justify-start text-xs h-9" onClick={() => setActiveQuickAction("send_notify")}>
                    <MessageSquare className="mr-2 h-4 w-4 text-primary" /> Send Notification
                  </Button>
                </div>

                {activeQuickAction === "award_points" && (
                  <form onSubmit={handleAwardPoints} className="mt-4 p-3 rounded-lg border border-border bg-muted/30 space-y-3">
                    <div className="text-xs font-semibold text-foreground">Award Points Form</div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Points</label>
                      <input
                        type="number"
                        value={pointsAmount}
                        onChange={(e) => setPointsAmount(Number(e.target.value))}
                        className="w-full rounded bg-background px-2 py-1 text-xs border border-input mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Remarks</label>
                      <input
                        type="text"
                        value={actionRemarks}
                        placeholder="Reason..."
                        onChange={(e) => setActionRemarks(e.target.value)}
                        className="w-full rounded bg-background px-2 py-1 text-xs border border-input mt-1"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" size="sm" className="w-full text-xs">Award</Button>
                      <Button size="sm" variant="ghost" onClick={() => setActiveQuickAction(null)}>Cancel</Button>
                    </div>
                  </form>
                )}

                {activeQuickAction === "send_notify" && (
                  <form onSubmit={handleSendNotification} className="mt-4 p-3 rounded-lg border border-border bg-muted/30 space-y-3">
                    <div className="text-xs font-semibold text-foreground">Send Message Form</div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Message</label>
                      <textarea
                        value={notificationMsg}
                        placeholder="Type message here..."
                        onChange={(e) => setNotificationMsg(e.target.value)}
                        className="w-full rounded bg-background px-2 py-1 text-xs border border-input mt-1 h-16 resize-none"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" size="sm" className="w-full text-xs">Send</Button>
                      <Button size="sm" variant="ghost" onClick={() => setActiveQuickAction(null)}>Cancel</Button>
                    </div>
                  </form>
                )}

                {activeQuickAction === "borrow_equip" && (
                  <form onSubmit={handleRequestBorrow} className="mt-4 p-3 rounded-lg border border-border bg-muted/30 space-y-3">
                    <div className="text-xs font-semibold text-foreground">Borrow Request Form</div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Asset Name/ID</label>
                      <input
                        type="text"
                        required
                        value={borrowItemId}
                        placeholder="e.g. Arduino Uno"
                        onChange={(e) => setBorrowItemId(e.target.value)}
                        className="w-full rounded bg-background px-2 py-1 text-xs border border-input mt-1"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" size="sm" className="w-full text-xs">Borrow</Button>
                      <Button size="sm" variant="ghost" onClick={() => setActiveQuickAction(null)}>Cancel</Button>
                    </div>
                  </form>
                )}
              </div>

              <div className="md:col-span-3 space-y-4 text-left">
                <div className="flex border-b border-border space-x-4 text-sm">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`pb-2 font-medium ${activeTab === "profile" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
                  >
                    Workspace Details
                  </button>
                  <button
                    onClick={() => setActiveTab("timeline")}
                    className={`pb-2 font-medium ${activeTab === "timeline" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
                  >
                    Activity Timeline
                  </button>
                </div>

                {activeTab === "profile" ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      <h5 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">Profile Overview</h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Club Membership ID:</span>
                          <span className="font-mono text-xs text-blue-400 font-semibold">{selectedMember.clubMembershipId || "SAC-RC-000000"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Internal Member ID:</span>
                          <span className="font-mono text-xs text-slate-300">{selectedMember.memberId || "MEM-2026-0000"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Department:</span>
                          <span className="font-medium">{selectedMember.branch || "ECE"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Role:</span>
                          <span className="font-medium">{selectedMember.role || "Member"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{selectedMember.email}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">{selectedMember.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">Quick Scorecard</h5>
                      <div className="grid gap-4 grid-cols-2">
                        <div className="rounded-xl border border-border p-3 space-y-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">Total Points</span>
                          <div className="text-lg font-bold text-emerald-500">
                            {memberScore ? `${memberScore.totalPoints} Pts` : "Loading..."}
                          </div>
                        </div>
                        <div className="rounded-xl border border-border p-3 space-y-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">Status</span>
                          <div className="mt-1">
                            <Badge variant={selectedMember.status === "active" ? "success" : "secondary"}>
                              {selectedMember.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    <div className="relative border-l border-border pl-6 ml-3 space-y-4">
                      <div className="relative">
                        <div className="absolute -left-[30px] top-1 bg-primary text-primary-foreground h-5 w-5 rounded-full flex items-center justify-center">
                          <Activity className="h-3 w-3" />
                        </div>
                        <h6 className="text-xs font-semibold text-foreground">Member profile initialized in directory</h6>
                        <span className="text-[10px] text-muted-foreground">Authoritative audit ledger timestamp logged</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Register New Member</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Valid ECE Member"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 26RC681271"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Department / Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="ECE">ECE</option>
                    <option value="CSM">CSM</option>
                    <option value="EEE">EEE</option>
                    <option value="CSE">CSE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="INF">INF</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Club Membership ID (Optional)</label>
                  <input
                    type="text"
                    value={clubMembershipId}
                    onChange={(e) => setClubMembershipId(e.target.value)}
                    placeholder="e.g. SAC-RC-681271"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Internal Member ID (Optional)</label>
                  <input
                    type="text"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    placeholder="e.g. MEM-2026-9520"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ece.681271@test.org"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={1}>1st</option>
                    <option value={2}>2nd</option>
                    <option value={3}>3rd</option>
                    <option value={4}>4th</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Member">Member</option>
                    <option value="Lead">Lead</option>
                    <option value="Core">Core</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Registering..." : "Register Member"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Edit Member Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Department / Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="ECE">ECE</option>
                    <option value="CSM">CSM</option>
                    <option value="EEE">EEE</option>
                    <option value="CSE">CSE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="INF">INF</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={1}>1st</option>
                    <option value={2}>2nd</option>
                    <option value={3}>3rd</option>
                    <option value={4}>4th</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Member">Member</option>
                    <option value="Lead">Lead</option>
                    <option value="Core">Core</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Updating..." : "Save Changes"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
