"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { EventSelect } from "@/db/schema";
import {
  SubmissionWithImages,
  EventRankingItem,
} from "@/services/events";
import {
  updateSubmissionStatusAction,
  startVotingAction,
  pauseVotingAction,
  resumeVotingAction,
  stopVotingAction,
  finalizeEventWinnersAction,
  getCompetitionEventAdminAction,
  updateCompetitionEventAction,
  uploadEventCoverImageAction,
} from "@/actions/events/club-events.actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  SubmissionStatusBadge,
  VotingStateBadge,
  WinnerStatusBadge,
  SubmissionItemStatusBadge,
} from "./event-status-badge";
import { SubmissionDetailDrawer } from "./submission-detail-drawer";
import { EditEventDrawer } from "./edit-event-drawer";
import {
  Trophy,
  Users,
  FileText,
  Vote,
  Clock,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Play,
  Pause,
  StopCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Eye,
  Check,
  X,
  Upload,
  Layers,
  Award,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface EventWorkspaceClientProps {
  initialEvent: EventSelect;
  initialStats: {
    totalParticipants: number;
    members: number;
    freshers: number;
    totalSubmissions: number;
    publishedSubmissions: number;
    submittedSubmissions: number;
    rejectedSubmissions: number;
    totalVotes: number;
  };
  initialSubmissions: SubmissionWithImages[];
  initialRankings: EventRankingItem[];
}

type TabType = "overview" | "submissions" | "voting" | "config";

export function EventWorkspaceClient({
  initialEvent,
  initialStats,
  initialSubmissions,
  initialRankings,
}: EventWorkspaceClientProps) {
  const [event, setEvent] = useState<EventSelect>(initialEvent);
  const [stats, setStats] = useState(initialStats);
  const [submissions, setSubmissions] = useState<SubmissionWithImages[]>(initialSubmissions);
  const [rankings, setRankings] = useState<EventRankingItem[]>(initialRankings);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Selected submission drawer
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithImages | null>(null);

  // Quick configuration drawer
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: "destructive" | "warning" | "default";
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  // Submissions filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [participantTypeFilter, setParticipantTypeFilter] = useState<string>("ALL");
  const [winnerFilter, setWinnerFilter] = useState<boolean>(false);

  // Configuration form state
  const [cfgName, setCfgName] = useState(event.name);
  const [cfgDescription, setCfgDescription] = useState(event.description || "");
  const [cfgVenue, setCfgVenue] = useState(event.venue || "");
  const [cfgPoints, setCfgPoints] = useState(event.submissionPoints ?? event.points ?? 35);
  const [cfgVotingPercentage, setCfgVotingPercentage] = useState(event.votingPercentage ?? 40);
  const [cfgCoverUrl, setCfgCoverUrl] = useState(event.coverImageUrl || "");
  const [cfgCoverUploading, setCfgCoverUploading] = useState(false);
  const [cfgSubStart, setCfgSubStart] = useState(
    event.submissionStartAt ? new Date(event.submissionStartAt).toISOString().slice(0, 16) : ""
  );
  const [cfgSubEnd, setCfgSubEnd] = useState(
    event.submissionEndAt ? new Date(event.submissionEndAt).toISOString().slice(0, 16) : ""
  );
  const [cfgMinImages, setCfgMinImages] = useState(event.minImages ?? 1);
  const [cfgMaxImages, setCfgMaxImages] = useState(event.maxImages ?? 2);
  const [cfgMinChars, setCfgMinChars] = useState(event.minDescriptionChars ?? 100);
  const [cfgVoteStart, setCfgVoteStart] = useState(
    event.votingStartAt ? new Date(event.votingStartAt).toISOString().slice(0, 16) : ""
  );
  const [cfgVoteEnd, setCfgVoteEnd] = useState(
    event.votingEndAt ? new Date(event.votingEndAt).toISOString().slice(0, 16) : ""
  );
  const [cfgVotesPerParticipant, setCfgVotesPerParticipant] = useState(event.votesPerParticipant ?? 1);
  const [cfgSelfVoting, setCfgSelfVoting] = useState(Boolean(event.selfVotingAllowed));
  const [cfgShowVoteCounts, setCfgShowVoteCounts] = useState(Boolean(event.showVoteCounts));
  const [cfgWinnersCount, setCfgWinnersCount] = useState(event.numberOfWinners ?? 1);

  // Re-fetch authoritative workspace data
  const reloadWorkspace = () => {
    startRefreshTransition(async () => {
      try {
        const res = await getCompetitionEventAdminAction(event.id);
        if (res.success && res.data) {
          setEvent(res.data.event);
          setStats(res.data.stats);
          setSubmissions(res.data.submissions);
          setRankings(res.data.rankings);
          setCfgPoints(res.data.event.submissionPoints ?? res.data.event.points ?? 35);
          setCfgVotingPercentage(res.data.event.votingPercentage ?? 40);
          // If drawer open, update selected submission
          if (selectedSubmission) {
            const updated = res.data.submissions.find((s) => s.id === selectedSubmission.id) || null;
            setSelectedSubmission(updated);
          }
        }
      } catch (err) {
        console.error("Failed to reload event workspace:", err);
      }
    });
  };

  // Helper date formatter
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Status mutation action
  const handleSubmissionStatus = async (
    submissionId: string,
    status: "published" | "rejected" | "hidden",
    feedbackMsg?: string
  ) => {
    startActionTransition(async () => {
      try {
        const res = await updateSubmissionStatusAction({
          submissionId,
          status,
          adminFeedback: feedbackMsg,
        });

        if (res.success) {
          setFeedback({
            type: "success",
            message: `Submission marked as "${status.toUpperCase()}".`,
          });
          reloadWorkspace();
        } else {
          setFeedback({
            type: "error",
            message: res.error?.message || "Failed to update submission status.",
          });
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "An unexpected error occurred.",
        });
      }
    });
  };

  // Voting lifecycle transitions
  const triggerStartVoting = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Start Active Peer Voting?",
      description:
        "Voting will open for all registered event participants. They will be able to cast their configured votes for published projects.",
      confirmLabel: "Start Voting Now",
      variant: "default",
      onConfirm: async () => {
        const res = await startVotingAction(event.id);
        if (res.success) {
          setFeedback({ type: "success", message: "Voting is now ACTIVE." });
          reloadWorkspace();
        } else {
          setFeedback({ type: "error", message: res.error?.message || "Failed to start voting." });
        }
      },
    });
  };

  const triggerPauseVoting = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Pause Voting?",
      description:
        "Voting will be temporarily paused. Participants will not be able to cast or modify votes until resumed.",
      confirmLabel: "Pause Voting",
      variant: "warning",
      onConfirm: async () => {
        const res = await pauseVotingAction(event.id);
        if (res.success) {
          setFeedback({ type: "success", message: "Voting has been PAUSED." });
          reloadWorkspace();
        } else {
          setFeedback({ type: "error", message: res.error?.message || "Failed to pause voting." });
        }
      },
    });
  };

  const triggerResumeVoting = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Resume Voting?",
      description: "Active voting will resume and participants will immediately be able to cast their votes.",
      confirmLabel: "Resume Voting",
      variant: "default",
      onConfirm: async () => {
        const res = await resumeVotingAction(event.id);
        if (res.success) {
          setFeedback({ type: "success", message: "Voting has RESUMED." });
          reloadWorkspace();
        } else {
          setFeedback({ type: "error", message: res.error?.message || "Failed to resume voting." });
        }
      },
    });
  };

  const triggerStopVoting = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Stop and Close Voting?",
      description:
        "Voting will be permanently closed for this challenge. No further votes or vote modifications will be accepted.",
      confirmLabel: "Stop Voting",
      variant: "destructive",
      onConfirm: async () => {
        const res = await stopVotingAction(event.id);
        if (res.success) {
          setFeedback({ type: "success", message: "Voting has been CLOSED." });
          reloadWorkspace();
        } else {
          setFeedback({ type: "error", message: res.error?.message || "Failed to close voting." });
        }
      },
    });
  };

  // Winner finalization
  const triggerFinalizeWinners = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Finalize Event Winners?",
      description: `This will lock the results and permanently assign Winner Ranks (1 through ${event.numberOfWinners || 1}) to the top-ranked submissions based on peer votes. This action cannot be reversed.`,
      confirmLabel: "Lock & Finalize Winners",
      variant: "warning",
      onConfirm: async () => {
        const res = await finalizeEventWinnersAction(event.id);
        if (res.success) {
          setFeedback({
            type: "success",
            message: `Successfully finalized ${res.data?.winnersCount || 0} winner(s)! Results are now locked.`,
          });
          reloadWorkspace();
        } else {
          setFeedback({
            type: "error",
            message: res.error?.message || "Failed to finalize winners.",
          });
        }
      },
    });
  };

  // Configuration tab save
  const handleSaveConfiguration = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startActionTransition(async () => {
      try {
        const pointsNum = Number(cfgPoints);
        const res = await updateCompetitionEventAction(event.id, {
          name: cfgName.trim(),
          description: cfgDescription.trim() || undefined,
          venue: cfgVenue.trim() || undefined,
          points: pointsNum,
          submissionPoints: pointsNum,
          votingPercentage: Number(cfgVotingPercentage),
          coverImageUrl: cfgCoverUrl.trim() || null,
          submissionStartAt: cfgSubStart ? new Date(cfgSubStart) : null,
          submissionEndAt: cfgSubEnd ? new Date(cfgSubEnd) : null,
          minImages: Number(cfgMinImages),
          maxImages: Number(cfgMaxImages),
          minDescriptionChars: Number(cfgMinChars),
          votingStartAt: cfgVoteStart ? new Date(cfgVoteStart) : null,
          votingEndAt: cfgVoteEnd ? new Date(cfgVoteEnd) : null,
          votesPerParticipant: Number(cfgVotesPerParticipant),
          selfVotingAllowed: Boolean(cfgSelfVoting),
          showVoteCounts: Boolean(cfgShowVoteCounts),
          numberOfWinners: Number(cfgWinnersCount),
        });

        if (res.success) {
          setFeedback({ type: "success", message: "Configuration saved successfully!" });
          reloadWorkspace();
        } else {
          setFeedback({ type: "error", message: res.error?.message || "Failed to save configuration." });
        }
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "An unexpected error occurred." });
      }
    });
  };

  const handleConfigCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCfgCoverUploading(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", event.id);

      const res = await uploadEventCoverImageAction(formData);
      if (res.success && res.data) {
        setCfgCoverUrl(res.data.imageUrl);
        setFeedback({ type: "success", message: "Cover image uploaded successfully." });
      } else {
        setFeedback({ type: "error", message: res.error?.message || "Failed to upload cover image." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to upload cover image." });
    } finally {
      setCfgCoverUploading(false);
    }
  };

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.participantName && s.participantName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (participantTypeFilter !== "ALL") {
        const isM = (s as any).participantType === "member";
        if (participantTypeFilter === "MEMBER" && !isM) return false;
        if (participantTypeFilter === "FRESHER" && isM) return false;
      }
      if (winnerFilter && !s.winnerRank) return false;

      return true;
    });
  }, [submissions, searchQuery, statusFilter, participantTypeFilter, winnerFilter]);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Club Events</span>
        </Link>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reloadWorkspace}
            disabled={isRefreshing}
            className="text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigDrawerOpen(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Quick Edit</span>
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* EVENT HEADER HERO                                                    */}
      {/* ==================================================================== */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        {/* Banner Cover */}
        <div className="h-44 w-full relative bg-muted/30 overflow-hidden border-b border-border">
          {event.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverImageUrl}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-950 via-slate-900 to-card flex items-center justify-center">
              <Trophy className="h-16 w-16 text-primary/30" />
            </div>
          )}

          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <WinnerStatusBadge finalized={Boolean(event.winnersFinalized)} />
          </div>
        </div>

        {/* Header Info Details */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs font-semibold">
                  Club Competition
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {event.points ? `${event.points} points reward` : "Standard activity"}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {event.name}
              </h1>
              <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                {event.description || "Robotics Club challenge workspace."}
              </p>
            </div>

            {/* Quick lifecycle controls right from header */}
            <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
              {event.votingState === "NOT_STARTED" && (
                <Button
                  size="sm"
                  onClick={triggerStartVoting}
                  disabled={isActionPending}
                  className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Start Voting</span>
                </Button>
              )}

              {event.votingState === "ACTIVE" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerPauseVoting}
                    disabled={isActionPending}
                    className="text-xs font-semibold gap-1.5 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={triggerStopVoting}
                    disabled={isActionPending}
                    className="text-xs font-bold gap-1.5"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    <span>Stop Voting</span>
                  </Button>
                </>
              )}

              {event.votingState === "PAUSED" && (
                <>
                  <Button
                    size="sm"
                    onClick={triggerResumeVoting}
                    disabled={isActionPending}
                    className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Resume</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={triggerStopVoting}
                    disabled={isActionPending}
                    className="text-xs font-bold gap-1.5"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    <span>Stop Voting</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Badges & Window Timeline */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60 text-xs">
            <SubmissionStatusBadge
              startAt={event.submissionStartAt}
              endAt={event.submissionEndAt}
            />
            <VotingStateBadge state={event.votingState} />

            <span className="text-muted-foreground">•</span>

            <span className="text-muted-foreground">
              Submissions:{" "}
              <strong className="text-foreground">
                {formatDate(event.submissionStartAt)} – {formatDate(event.submissionEndAt)}
              </strong>
            </span>

            <span className="text-muted-foreground">•</span>

            <span className="text-muted-foreground">
              Voting:{" "}
              <strong className="text-foreground">
                {formatDate(event.votingStartAt)} – {formatDate(event.votingEndAt)}
              </strong>
            </span>
          </div>
        </div>

        {/* Navigation Tabs Header */}
        <div className="flex border-t border-border bg-muted/20 px-6 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "submissions", label: `Submissions (${stats.totalSubmissions})`, icon: FileText },
            { id: "voting", label: "Voting & Rankings", icon: Trophy },
            { id: "config", label: "Configuration", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW                                                      */}
      {/* ==================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Winner Banner if Finalized */}
          {event.winnersFinalized && rankings.length > 0 && (
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>Competition Winners Finalized</span>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Winner: {rankings[0]?.participantName} — &ldquo;{rankings[0]?.title}&rdquo;
                </h3>
                <p className="text-xs text-muted-foreground">
                  Awarded #{rankings[0]?.rank} with {rankings[0]?.voteCount} peer votes. Results are officially locked.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("voting")}
                className="text-xs font-bold gap-1 text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
              >
                <Trophy className="h-3.5 w-3.5" />
                <span>View Full Final Rankings</span>
              </Button>
            </div>
          )}

          {/* Metric Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Participants"
              value={stats.totalParticipants}
              subtitle={`${stats.members} Members • ${stats.freshers} Freshers`}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Submissions"
              value={stats.totalSubmissions}
              subtitle={`${stats.publishedSubmissions} published • ${stats.submittedSubmissions} pending`}
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              title="Peer Votes"
              value={stats.totalVotes}
              subtitle={`${event.votesPerParticipant || 1} vote(s) allowed per voter`}
              icon={<Vote className="h-5 w-5" />}
            />
            <StatCard
              title="Winners Status"
              value={event.winnersFinalized ? "Finalized" : "Pending"}
              subtitle={
                event.winnersFinalized
                  ? `Locked for top ${event.numberOfWinners || 1}`
                  : `Configured for ${event.numberOfWinners || 1} winner(s)`
              }
              icon={<Award className="h-5 w-5" />}
            />
          </div>

          {/* Key Timestamps Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Event Lifecycle Timestamps
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Submissions Open
                </span>
                <span className="font-bold text-foreground">
                  {formatDate(event.submissionStartAt)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Submissions Close
                </span>
                <span className="font-bold text-foreground">
                  {formatDate(event.submissionEndAt)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Voting Starts
                </span>
                <span className="font-bold text-foreground">
                  {formatDate(event.votingStartAt)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Voting Ends
                </span>
                <span className="font-bold text-foreground">
                  {formatDate(event.votingEndAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Points Ledger Integration Summary Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Points Ledger & Leaderboard
                  </h3>
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 font-semibold">
                    Official Members Only
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Points automatically credit the canonical Points Ledger upon valid submission and voting.
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="text-muted-foreground">
                  Submission: <strong className="text-foreground">{event.submissionPoints ?? event.points ?? 100} pts</strong>
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  Voting: <strong className="text-foreground">{Math.round(((event.submissionPoints ?? event.points ?? 100) * (event.votingPercentage ?? 40)) / 100)} pts</strong> ({event.votingPercentage ?? 40}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Submission Points (Each)
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg font-bold text-foreground">
                    {event.submissionPoints ?? event.points ?? 100}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    pts on valid submission
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Voting Points (Each)
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg font-bold text-foreground">
                    {Math.round(((event.submissionPoints ?? event.points ?? 100) * (event.votingPercentage ?? 40)) / 100)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    pts on casting vote ({event.votingPercentage ?? 40}%)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] text-emerald-400 block font-medium">
                  Combined Max Event Reward
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg font-bold text-emerald-400">
                    {(event.submissionPoints ?? event.points ?? 100) + Math.round(((event.submissionPoints ?? event.points ?? 100) * (event.votingPercentage ?? 40)) / 100)}
                  </span>
                  <span className="text-[10px] text-emerald-500/70">
                    total event contribution
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Submissions Preview Table */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Recent Submissions
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("submissions")}
                className="text-xs font-semibold text-primary"
              >
                View all ({submissions.length}) →
              </Button>
            </div>

            {submissions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No submissions received yet for this challenge.
              </p>
            ) : (
              <div className="divide-y divide-border/60 text-xs">
                {submissions.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSubmission(s)}
                    className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-foreground">{s.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        by {s.participantName} • {formatDate(s.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-foreground text-xs">
                        {s.voteCount || 0} votes
                      </span>
                      <SubmissionItemStatusBadge status={s.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SUBMISSIONS MANAGEMENT                                        */}
      {/* ==================================================================== */}
      {activeTab === "submissions" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Submissions Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by project title or participant name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="submitted">Submitted (Pending Review)</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
                <option value="hidden">Hidden</option>
              </select>

              {/* Participant Type filter */}
              <select
                value={participantTypeFilter}
                onChange={(e) => setParticipantTypeFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Participants</option>
                <option value="MEMBER">Official Members</option>
                <option value="FRESHER">Freshers</option>
              </select>

              {/* Winner filter toggle */}
              <button
                onClick={() => setWinnerFilter(!winnerFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                  winnerFilter
                    ? "bg-amber-500 text-black"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Trophy className="h-3 w-3" />
                <span>Winners Only</span>
              </button>
            </div>
          </div>

          {/* Submissions List / Table */}
          {filteredSubmissions.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6 text-muted-foreground" />}
              title="No submissions match criteria"
              description={
                submissions.length === 0
                  ? "No submissions have been received for this challenge yet."
                  : "Try clearing search filters to see all submissions."
              }
            />
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">Project Title</th>
                      <th className="py-3 px-4 font-semibold">Participant</th>
                      <th className="py-3 px-4 font-semibold text-center">Images</th>
                      <th className="py-3 px-4 font-semibold">Submitted On</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-center">Votes</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredSubmissions.map((s) => {
                      const isMem = (s as any).participantType === "member";
                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-muted/20 transition-colors group cursor-pointer"
                          onClick={() => setSelectedSubmission(s)}
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground line-clamp-1">
                              {s.title}
                            </div>
                            {s.winnerRank && (
                              <Badge variant="warning" className="text-[10px] gap-1 mt-0.5">
                                <Trophy className="h-2.5 w-2.5" />
                                <span>Winner #{s.winnerRank}</span>
                              </Badge>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-foreground">
                              {s.participantName || "Participant"}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {isMem ? "Official Member" : "Fresher"}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center font-mono">
                            {s.images?.length || 0}
                          </td>

                          <td className="py-3 px-4 text-muted-foreground">
                            {formatDate(s.createdAt)}
                          </td>

                          <td className="py-3 px-4">
                            <SubmissionItemStatusBadge status={s.status} />
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-foreground">
                            {s.voteCount ?? 0}
                          </td>

                          <td
                            className="py-3 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end space-x-1.5">
                              {s.status !== "published" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmissionStatus(s.id, "published")}
                                  disabled={isActionPending}
                                  className="h-7 text-[11px] font-bold px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Publish
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSubmission(s)}
                                className="h-7 text-[11px] font-semibold px-2.5"
                              >
                                Details
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-border/60 text-xs">
                {filteredSubmissions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSubmission(s)}
                    className="p-4 space-y-3 cursor-pointer hover:bg-muted/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-foreground text-sm">{s.title}</div>
                        <div className="text-muted-foreground text-[11px]">
                          by {s.participantName} ({(s as any).participantType === "member" ? "Member" : "Fresher"})
                        </div>
                      </div>
                      <SubmissionItemStatusBadge status={s.status} />
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>{s.images?.length || 0} photo(s) attached</span>
                      <span className="font-bold text-foreground">{s.voteCount || 0} votes</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(s.createdAt)}
                      </span>
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        {s.status !== "published" && (
                          <Button
                            size="sm"
                            onClick={() => handleSubmissionStatus(s.id, "published")}
                            disabled={isActionPending}
                            className="h-7 text-[11px] font-bold px-2 bg-emerald-600 text-white"
                          >
                            Publish
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubmission(s)}
                          className="h-7 text-[11px] font-semibold px-2"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: VOTING & RANKINGS                                             */}
      {/* ==================================================================== */}
      {activeTab === "voting" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Voting Controls & Winner Finalization Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voting Control Panel */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center space-x-1.5">
                    <Vote className="h-4 w-4 text-primary" />
                    <span>Voting Control Panel</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage active peer voting lifecycle states and accessibility
                  </p>
                </div>
                <VotingStateBadge state={event.votingState} />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 border border-border rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
                    Votes per Voter
                  </span>
                  <span className="font-bold text-foreground">
                    {event.votesPerParticipant || 1} vote slot(s)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
                    Self Voting Allowed
                  </span>
                  <span className="font-bold text-foreground">
                    {event.selfVotingAllowed ? "Allowed" : "Blocked"}
                  </span>
                </div>
              </div>

              {/* State Transition Actions */}
              <div className="pt-2">
                {event.votingState === "NOT_STARTED" && (
                  <Button
                    size="sm"
                    onClick={triggerStartVoting}
                    disabled={isActionPending}
                    className="w-full text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Play className="h-4 w-4" />
                    <span>Open / Start Peer Voting</span>
                  </Button>
                )}

                {event.votingState === "ACTIVE" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerPauseVoting}
                      disabled={isActionPending}
                      className="text-xs font-semibold gap-1.5 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    >
                      <Pause className="h-4 w-4" />
                      <span>Pause Voting</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={triggerStopVoting}
                      disabled={isActionPending}
                      className="text-xs font-bold gap-1.5"
                    >
                      <StopCircle className="h-4 w-4" />
                      <span>Stop &amp; Close Voting</span>
                    </Button>
                  </div>
                )}

                {event.votingState === "PAUSED" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="sm"
                      onClick={triggerResumeVoting}
                      disabled={isActionPending}
                      className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Play className="h-4 w-4" />
                      <span>Resume Voting</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={triggerStopVoting}
                      disabled={isActionPending}
                      className="text-xs font-bold gap-1.5"
                    >
                      <StopCircle className="h-4 w-4" />
                      <span>Close Voting</span>
                    </Button>
                  </div>
                )}

                {event.votingState === "CLOSED" && (
                  <div className="p-3 bg-muted/40 border border-border rounded-xl text-center text-xs text-muted-foreground">
                    Voting has been closed. Final results are ready for winner review.
                  </div>
                )}
              </div>
            </div>

            {/* Winner Finalization Control Panel */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground flex items-center space-x-1.5">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span>Winner Finalization</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Lock competition results and award winner ranks
                  </p>
                </div>
                <WinnerStatusBadge finalized={Boolean(event.winnersFinalized)} />
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Configured Winners:</span>
                  <span className="font-bold text-foreground">
                    Top {event.numberOfWinners || 1} ranked project(s)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Voting State Requirement:</span>
                  <span className="font-bold text-foreground">
                    {event.votingState === "CLOSED" ? (
                      <span className="text-emerald-400">Voting is CLOSED (Ready)</span>
                    ) : (
                      <span className="text-amber-400">Requires CLOSED voting</span>
                    )}
                  </span>
                </div>
              </div>

              {event.winnersFinalized ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-400 font-bold space-y-1">
                  <div className="flex items-center justify-center space-x-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Competition Results Locked &amp; Finalized</span>
                  </div>
                  {event.winnersFinalizedAt && (
                    <div className="text-[11px] font-normal text-muted-foreground">
                      Locked on {formatDate(event.winnersFinalizedAt)}
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={triggerFinalizeWinners}
                  disabled={isActionPending || event.votingState !== "CLOSED"}
                  className="w-full text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Finalize &amp; Lock Winners</span>
                </Button>
              )}
            </div>
          </div>

          {/* Authoritative Rankings Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs space-y-3 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground flex items-center space-x-1.5">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>Authoritative Rankings</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Computed directly by vote counts with deterministic tie-breaking (vote count DESC, then submission time ASC)
                </p>
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {rankings.length} published project(s) ranked
              </span>
            </div>

            {rankings.length === 0 ? (
              <EmptyState
                icon={<Trophy className="h-6 w-6 text-muted-foreground" />}
                title="No rankings available"
                description="Rankings will appear once published project submissions receive peer votes."
              />
            ) : (
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                      <th className="py-3 px-4 font-semibold w-16 text-center">Rank</th>
                      <th className="py-3 px-4 font-semibold">Project Title</th>
                      <th className="py-3 px-4 font-semibold">Participant</th>
                      <th className="py-3 px-4 font-semibold text-center">Peer Votes</th>
                      <th className="py-3 px-4 font-semibold">Submitted On</th>
                      <th className="py-3 px-4 font-semibold text-right">Award Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rankings.map((r) => {
                      const isRank1 = r.rank === 1;
                      const isRank2 = r.rank === 2;
                      const isRank3 = r.rank === 3;

                      return (
                        <tr
                          key={r.submissionId}
                          className={`hover:bg-muted/20 transition-colors ${
                            r.winnerRank ? "bg-amber-500/5" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            {isRank1 ? (
                              <span className="inline-flex h-6 w-6 rounded-full bg-amber-400 text-black font-bold items-center justify-center text-xs">
                                1
                              </span>
                            ) : isRank2 ? (
                              <span className="inline-flex h-6 w-6 rounded-full bg-slate-300 text-black font-bold items-center justify-center text-xs">
                                2
                              </span>
                            ) : isRank3 ? (
                              <span className="inline-flex h-6 w-6 rounded-full bg-amber-700 text-white font-bold items-center justify-center text-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-semibold">
                                #{r.rank}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground">{r.title}</div>
                          </td>

                          <td className="py-3 px-4 font-medium text-foreground">
                            {r.participantName}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-foreground text-sm">
                              {r.voteCount}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-muted-foreground">
                            {formatDate(r.submissionCreatedAt)}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {r.winnerRank ? (
                              <Badge variant="warning" className="gap-1 font-bold">
                                <Trophy className="h-3 w-3" />
                                <span>Winner #{r.winnerRank}</span>
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">Participant</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: CONFIGURATION                                                 */}
      {/* ==================================================================== */}
      {activeTab === "config" && (
        <form
          onSubmit={handleSaveConfiguration}
          className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Event Configuration</h3>
              <p className="text-xs text-muted-foreground">
                Modify challenge parameters, deadlines, image constraints, and voting rules
              </p>
            </div>
            <Button
              type="submit"
              disabled={isActionPending || cfgCoverUploading}
              size="sm"
              className="text-xs font-bold"
            >
              {isActionPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>

          {/* Section 1: General */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              1. General Details
            </h4>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-foreground">Event Name *</label>
              <input
                type="text"
                required
                value={cfgName}
                onChange={(e) => setCfgName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-foreground">Description</label>
              <textarea
                rows={3}
                value={cfgDescription}
                onChange={(e) => setCfgDescription(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Venue</label>
                <input
                  type="text"
                  value={cfgVenue}
                  onChange={(e) => setCfgVenue(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Submission Points</label>
                <input
                  type="number"
                  min={0}
                  value={cfgPoints}
                  onChange={(e) => setCfgPoints(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Voting Percentage (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={cfgVotingPercentage}
                  onChange={(e) => setCfgVotingPercentage(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground">
                  Voting reward: {Math.round((cfgPoints * cfgVotingPercentage) / 100)} pts ({cfgVotingPercentage}%)
                </p>
              </div>
            </div>

            {/* Cover image upload / edit */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-foreground">Cover Image</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  value={cfgCoverUrl}
                  onChange={(e) => setCfgCoverUrl(e.target.value)}
                  placeholder="Image URL or upload banner"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-secondary/80 transition-colors text-xs font-medium">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{cfgCoverUploading ? "Uploading..." : "Upload Banner"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleConfigCoverUpload}
                    disabled={cfgCoverUploading}
                  />
                </label>
              </div>

              {cfgCoverUrl && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-border max-h-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cfgCoverUrl}
                    alt="Cover preview"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCfgCoverUrl("")}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-md hover:bg-black"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Section 2: Submissions */}
          <div className="space-y-4 text-xs">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              2. Submissions Settings
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Submission Opens</label>
                <input
                  type="datetime-local"
                  value={cfgSubStart}
                  onChange={(e) => setCfgSubStart(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Submission Closes</label>
                <input
                  type="datetime-local"
                  value={cfgSubEnd}
                  onChange={(e) => setCfgSubEnd(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Min Images</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={cfgMinImages}
                  onChange={(e) => setCfgMinImages(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Max Images</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={cfgMaxImages}
                  onChange={(e) => setCfgMaxImages(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Min Description Chars</label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={cfgMinChars}
                  onChange={(e) => setCfgMinChars(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Section 3: Voting & Results */}
          <div className="space-y-4 text-xs">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              3. Voting &amp; Results
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Voting Starts</label>
                <input
                  type="datetime-local"
                  value={cfgVoteStart}
                  onChange={(e) => setCfgVoteStart(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Voting Ends</label>
                <input
                  type="datetime-local"
                  value={cfgVoteEnd}
                  onChange={(e) => setCfgVoteEnd(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Votes per Participant</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={cfgVotesPerParticipant}
                  onChange={(e) => setCfgVotesPerParticipant(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Number of project votes each participant may use during active voting.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Number of Winners</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={cfgWinnersCount}
                  onChange={(e) => setCfgWinnersCount(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfgSelfVoting}
                  onChange={(e) => setCfgSelfVoting(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-foreground">Allow Self-Voting</span>
                  <p className="text-[11px] text-muted-foreground">
                    Allow participants to vote for their own project submission.
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfgShowVoteCounts}
                  onChange={(e) => setCfgShowVoteCounts(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-foreground">Show Live Vote Counts to Public</span>
                  <p className="text-[11px] text-muted-foreground">
                    If disabled, vote counts remain hidden from public gallery until voting closes.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end">
            <Button
              type="submit"
              disabled={isActionPending || cfgCoverUploading}
              size="sm"
              className="text-xs font-bold"
            >
              {isActionPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* DRAWERS & CONFIRMATION DIALOGS                                       */}
      {/* ==================================================================== */}
      <SubmissionDetailDrawer
        submission={selectedSubmission}
        isOpen={Boolean(selectedSubmission)}
        onClose={() => setSelectedSubmission(null)}
        onStatusChange={handleSubmissionStatus}
        isUpdating={isActionPending}
      />

      <EditEventDrawer
        event={isConfigDrawerOpen ? event : null}
        isOpen={isConfigDrawerOpen}
        onClose={() => setIsConfigDrawerOpen(false)}
        onSuccess={reloadWorkspace}
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await confirmDialog.onConfirm();
        }}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        isLoading={isActionPending}
      />
    </div>
  );
}
