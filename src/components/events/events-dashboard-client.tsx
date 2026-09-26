"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ClubEventAdminListItem,
  getClubEventsAdminAction,
} from "@/actions/events/club-events.actions";
import {
  SubmissionStatusBadge,
  VotingStateBadge,
  WinnerStatusBadge,
} from "./event-status-badge";
import { CreateEventDrawer } from "./create-event-drawer";
import { EditEventDrawer } from "./edit-event-drawer";
import { EventSelect } from "@/db/schema";
import {
  Trophy,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  Users,
  FileText,
  Vote,
  Settings,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";

interface EventsDashboardClientProps {
  initialEvents: ClubEventAdminListItem[];
}

export function EventsDashboardClient({
  initialEvents,
}: EventsDashboardClientProps) {
  const [events, setEvents] = useState<ClubEventAdminListItem[]>(initialEvents);
  const [isRefreshing, startTransition] = useTransition();

  // Drawers
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventSelect | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED" | "CLOSED">("ALL");

  const refreshEvents = () => {
    startTransition(async () => {
      try {
        const res = await getClubEventsAdminAction();
        if (res.success && res.data) {
          setEvents(res.data.events);
        }
      } catch (err) {
        console.error("Failed to refresh events:", err);
      }
    });
  };

  // Metrics summary
  const totalCompetitions = events.length;
  const activeVotingCount = events.filter((e) => e.votingState === "ACTIVE").length;
  const totalSubmissionsSum = events.reduce((sum, e) => sum + (e.stats?.submissions || 0), 0);
  const finalizedCount = events.filter((e) => e.winnersFinalized).length;

  // Filtered events
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "ACTIVE") return e.votingState === "ACTIVE";
    if (statusFilter === "PAUSED") return e.votingState === "PAUSED";
    if (statusFilter === "CLOSED") return e.votingState === "CLOSED";
    return true;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Club Events"
        description="Create, configure, manage and monitor Robotics Club events and competitions."
        icon={<Trophy className="h-5 w-5" />}
        action={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshEvents}
              disabled={isRefreshing}
              className="text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateDrawerOpen(true)}
              className="text-xs font-bold gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Event</span>
            </Button>
          </div>
        }
      />

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Competitions"
          value={totalCompetitions}
          subtitle="All active & past challenges"
          icon={<Trophy className="h-5 w-5" />}
        />
        <StatCard
          title="Active Voting"
          value={activeVotingCount}
          subtitle="Currently open for votes"
          icon={<Vote className="h-5 w-5" />}
        />
        <StatCard
          title="Total Submissions"
          value={totalSubmissionsSum}
          subtitle="Student project uploads"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Finalized Winners"
          value={finalizedCount}
          subtitle="Completed challenges"
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events by title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {(["ALL", "ACTIVE", "PAUSED", "CLOSED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {st === "ALL" ? "All Events" : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards Grid */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6 text-muted-foreground" />}
          title="No club events found"
          description={
            searchQuery || statusFilter !== "ALL"
              ? "No events match the selected filter criteria."
              : "No club events have been created yet. Launch your first competition!"
          }
          actionLabel={searchQuery || statusFilter !== "ALL" ? undefined : "Create First Event"}
          onAction={searchQuery || statusFilter !== "ALL" ? undefined : () => setIsCreateDrawerOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-primary/40"
            >
              <div>
                {/* Event Cover Image / Banner */}
                <div className="h-36 w-full relative bg-muted/30 overflow-hidden border-b border-border">
                  {evt.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={evt.coverImageUrl}
                      alt={evt.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-950/40 via-background to-card flex items-center justify-center">
                      <Trophy className="h-10 w-10 text-primary/40" />
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5">
                    <WinnerStatusBadge finalized={Boolean(evt.winnersFinalized)} />
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        Competition
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {evt.points ? `${evt.points} pts` : "Workshop"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {evt.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {evt.description || "Robotics Club competition event."}
                    </p>
                  </div>

                  {/* Lifecycle Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <SubmissionStatusBadge
                      startAt={evt.submissionStartAt}
                      endAt={evt.submissionEndAt}
                    />
                    <VotingStateBadge state={evt.votingState} />
                  </div>

                  {/* Windows / Timestamps */}
                  <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Submissions:</span>
                      </span>
                      <span className="font-medium text-foreground">
                        {formatDate(evt.submissionStartAt)} – {formatDate(evt.submissionEndAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Vote className="h-3 w-3" />
                        <span>Voting:</span>
                      </span>
                      <span className="font-medium text-foreground">
                        {formatDate(evt.votingStartAt)} – {formatDate(evt.votingEndAt)}
                      </span>
                    </div>
                  </div>

                  {/* Key Stats Pill Counters */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-muted/20 border border-border/40">
                      <div className="font-bold text-foreground text-sm">
                        {evt.stats?.submissions ?? 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Projects</div>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/20 border border-border/40">
                      <div className="font-bold text-foreground text-sm">
                        {evt.stats?.participants ?? 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Registered</div>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/20 border border-border/40">
                      <div className="font-bold text-foreground text-sm">
                        {evt.stats?.votes ?? 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Votes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingEvent(evt)}
                  className="text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Configure</span>
                </Button>

                <Link href={`/dashboard/events/${evt.id}`}>
                  <Button size="sm" className="text-xs font-bold gap-1.5">
                    <span>Manage Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawers */}
      <CreateEventDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onSuccess={refreshEvents}
      />

      <EditEventDrawer
        event={editingEvent}
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        onSuccess={refreshEvents}
      />
    </div>
  );
}
