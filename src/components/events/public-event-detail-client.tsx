"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { EventSelect, EventParticipantSelect, EventVoteSelect } from "@/db/schema";
import { SubmissionWithImages } from "@/services/events";
import {
  getPublishedSubmissionsAction,
  getMySubmissionAction,
  getMyVotesAction,
  castVoteAction,
  removeVoteAction,
} from "@/actions/events/club-events.actions";
import {
  SubmissionStatusBadge,
  VotingStateBadge,
  SubmissionItemStatusBadge,
} from "./event-status-badge";
import { PublicParticipationModal } from "./public-participation-modal";
import { PublicSubmissionModal } from "./public-submission-modal";
import { PublicProjectDetailModal } from "./public-project-detail-modal";
import {
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
  Vote,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  Award,
  Layers,
  Check,
  Eye,
  RefreshCw,
} from "lucide-react";

interface PublicEventDetailClientProps {
  event: EventSelect;
  initialSubmissions: SubmissionWithImages[];
}

interface StoredParticipantSession {
  id: string;
  displayName: string;
  isMember?: boolean;
}

export function PublicEventDetailClient({
  event,
  initialSubmissions,
}: PublicEventDetailClientProps) {
  const [submissions, setSubmissions] = useState<SubmissionWithImages[]>(initialSubmissions);
  const [activeParticipant, setActiveParticipant] = useState<StoredParticipantSession | null>(null);
  const [mySubmission, setMySubmission] = useState<SubmissionWithImages | null>(null);
  const [myVotes, setMyVotes] = useState<EventVoteSelect[]>([]);

  // Modals
  const [isParticipationOpen, setIsParticipationOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<SubmissionWithImages | null>(null);

  // Transitions & Feedbacks
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isVotePending, startVoteTransition] = useTransition();
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const storageKey = `rc_participant_session_${event.id}`;

  // 1. Rehydrate stored participant session on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredParticipantSession = JSON.parse(stored);
        if (parsed && parsed.id) {
          setActiveParticipant(parsed);
        }
      }
    } catch {}
  }, [storageKey]);

  // 2. Fetch participant's own submission and votes whenever activeParticipant changes
  useEffect(() => {
    if (!activeParticipant) return;

    let isMounted = true;
    const fetchUserData = async () => {
      try {
        const [subRes, votesRes] = await Promise.all([
          getMySubmissionAction(event.id, activeParticipant.id),
          getMyVotesAction(event.id, activeParticipant.id),
        ]);

        if (isMounted) {
          if (subRes.success && subRes.data) {
            setMySubmission(subRes.data);
          }
          if (votesRes.success && votesRes.data) {
            setMyVotes(votesRes.data);
          }
        }
      } catch {}
    };

    fetchUserData();
    return () => {
      isMounted = false;
    };
  }, [event.id, activeParticipant]);

  // Reload published gallery & user state
  const reloadEventData = () => {
    startRefreshTransition(async () => {
      try {
        const [subsRes, votesRes, mySubRes] = await Promise.all([
          getPublishedSubmissionsAction(event.id),
          activeParticipant ? getMyVotesAction(event.id, activeParticipant.id) : Promise.resolve(null),
          activeParticipant ? getMySubmissionAction(event.id, activeParticipant.id) : Promise.resolve(null),
        ]);

        if (subsRes.success && subsRes.data) {
          setSubmissions(subsRes.data);
        }
        if (votesRes && votesRes.success && votesRes.data) {
          setMyVotes(votesRes.data);
        }
        if (mySubRes && mySubRes.success) {
          setMySubmission(mySubRes.data || null);
        }
      } catch {}
    });
  };

  // Participant Established callback from ParticipationModal
  const handleParticipantEstablished = (
    participant: EventParticipantSelect,
    displayName: string
  ) => {
    const session: StoredParticipantSession = {
      id: participant.id,
      displayName,
      isMember: participant.participantType === "member",
    };
    setActiveParticipant(session);
    try {
      localStorage.setItem(storageKey, JSON.stringify(session));
    } catch {}

    setBannerFeedback({
      type: "success",
      message: `Welcome, ${displayName}! Your participation has been confirmed.`,
    });

    // If submissions are open and not submitted, guide user directly into submission flow
    const now = new Date();
    const isSubOpen =
      (!event.submissionStartAt || now >= new Date(event.submissionStartAt)) &&
      (!event.submissionEndAt || now <= new Date(event.submissionEndAt));

    if (isSubOpen && !mySubmission) {
      setTimeout(() => {
        setIsSubmissionModalOpen(true);
      }, 400);
    }
  };

  // Vote Cast
  const handleVote = async (submissionId: string) => {
    if (!activeParticipant) {
      setIsParticipationOpen(true);
      return;
    }

    startVoteTransition(async () => {
      try {
        const res = await castVoteAction({
          eventId: event.id,
          participantId: activeParticipant.id,
          submissionId,
        });

        if (res.success) {
          setBannerFeedback({
            type: "success",
            message: "Your vote has been successfully recorded!",
          });
          reloadEventData();
        } else {
          setBannerFeedback({
            type: "error",
            message: res.error?.message || "Failed to cast vote.",
          });
        }
      } catch (err: any) {
        setBannerFeedback({
          type: "error",
          message: err.message || "An unexpected error occurred while voting.",
        });
      }
    });
  };

  // Vote Remove
  const handleRemoveVote = async (submissionId: string) => {
    if (!activeParticipant) return;

    startVoteTransition(async () => {
      try {
        const res = await removeVoteAction({
          eventId: event.id,
          participantId: activeParticipant.id,
          submissionId,
        });

        if (res.success) {
          setBannerFeedback({
            type: "info",
            message: "Your vote has been removed.",
          });
          reloadEventData();
        } else {
          setBannerFeedback({
            type: "error",
            message: res.error?.message || "Failed to remove vote.",
          });
        }
      } catch (err: any) {
        setBannerFeedback({
          type: "error",
          message: err.message || "An unexpected error occurred while removing your vote.",
        });
      }
    });
  };

  // State calculations
  const now = new Date();
  const isSubmissionOpen =
    (!event.submissionStartAt || now >= new Date(event.submissionStartAt)) &&
    (!event.submissionEndAt || now <= new Date(event.submissionEndAt));
  const isVotingActive = event.votingState === "ACTIVE";
  const votesAllowed = event.votesPerParticipant || 1;
  const votesUsed = myVotes.length;
  const canVoteMore = votesUsed < votesAllowed;

  const votedSubmissionIds = new Set(myVotes.map((v) => v.submissionId));

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main className="flex-1">
        {/* Banner Feedback Toast */}
        {bannerFeedback ? (
          <div className="bg-slate-900 text-white py-3 px-4 shadow-md transition-all">
            <div className="mx-auto max-w-7xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {bannerFeedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                ) : bannerFeedback.type === "error" ? (
                  <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                ) : (
                  <Sparkles className="h-4 w-4 text-blue-400 flex-shrink-0" />
                )}
                <span className="font-medium">{bannerFeedback.message}</span>
              </div>
              <button
                onClick={() => setBannerFeedback(null)}
                className="text-slate-400 hover:text-white transition-colors text-xs font-semibold ml-4"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200">
          {/* Cover Hero Banner Image */}
          <div className="relative h-56 sm:h-72 lg:h-80 w-full overflow-hidden bg-slate-950">
            {event.coverImageUrl ? (
              <img
                src={event.coverImageUrl}
                alt={event.name}
                className="h-full w-full object-cover object-center brightness-90"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
                <div className="text-center space-y-3 p-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-xs border border-white/10 shadow-lg">
                    <Trophy className="h-7 w-7 text-amber-400" />
                  </div>
                  <div className="text-xs uppercase tracking-widest font-bold text-slate-300">
                    Official Robotics Club Challenge
                  </div>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Bottom Floating Bar on Hero */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <SubmissionStatusBadge
                  startAt={event.submissionStartAt}
                  endAt={event.submissionEndAt}
                />
                <VotingStateBadge state={event.votingState} />
              </div>

              <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 rounded-full bg-white/15 backdrop-blur-md px-3 sm:px-3.5 py-1 text-[11px] sm:text-xs font-bold text-amber-300 border border-white/20 shadow-md">
                <span className="inline-flex items-center space-x-1.5">
                  <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
                  <span>{event.submissionPoints ?? 100} Pts (Sub)</span>
                </span>
                <span className="text-white/40">•</span>
                <span>{Math.round(((event.submissionPoints ?? 100) * (event.votingPercentage ?? 40)) / 100)} Pts (Vote)</span>
                <span className="text-white/40 hidden sm:inline">•</span>
                <span className="text-[10px] sm:text-[11px] font-normal text-amber-200/90 hidden sm:inline">Official Members</span>
              </div>
            </div>
          </div>

          {/* Title & Primary Action Area */}
          <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6">
              <div className="space-y-2.5 sm:space-y-3 max-w-3xl">
                <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-600">
                  <Trophy className="h-3.5 w-3.5 shrink-0" />
                  <span>Robotics Club Innovation Series</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {event.name}
                </h1>

                <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
                  {event.description ||
                    "Participate in this official robotics engineering challenge. Build your prototype, document your engineering design, and showcase it for peer evaluation."}
                </p>

                {/* Event Points Information Chip */}
                <div className="inline-flex flex-wrap items-center gap-2 py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-900">
                  <div className="flex items-center space-x-1 font-bold text-amber-950">
                    <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Event Points:</span>
                  </div>
                  <span>
                    Sub: <strong>{event.submissionPoints ?? 100}</strong> pts
                  </span>
                  <span>•</span>
                  <span>
                    Vote: <strong>{Math.round(((event.submissionPoints ?? 100) * (event.votingPercentage ?? 40)) / 100)}</strong> pts
                  </span>
                  <span>•</span>
                  <span className="text-amber-700/80 italic text-[11px]">Official Club members only</span>
                </div>
              </div>

              {/* Primary Call to Action */}
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch md:items-end gap-2.5 pt-2 md:pt-0">
                {mySubmission ? (
                  <a
                    href="#my-submission"
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors min-h-[48px]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>View My Submission</span>
                  </a>
                ) : isSubmissionOpen ? (
                  <button
                    onClick={() => {
                      if (activeParticipant) {
                        setIsSubmissionModalOpen(true);
                      } else {
                        setIsParticipationOpen(true);
                      }
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all hover:scale-[1.02] min-h-[48px]"
                  >
                    <Upload className="h-4 w-4 text-blue-400" />
                    <span>
                      {activeParticipant ? "Submit Your Project" : "Participate / Submit Project"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <a
                    href="#gallery"
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-colors min-h-[48px]"
                  >
                    <Vote className="h-4 w-4 text-amber-400" />
                    <span>View Projects Gallery</span>
                  </a>
                )}
              </div>
            </div>

            {/* Active Identity Bar if Participant established */}
            {activeParticipant ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-blue-50/70 border border-blue-200/80 px-4 py-3 text-xs text-blue-900 gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate">
                    Participating as:{" "}
                    <strong className="font-bold text-slate-900">
                      {activeParticipant.displayName}
                    </strong>{" "}
                    ({activeParticipant.isMember ? "Verified Member" : "Registered Participant"})
                  </span>
                </div>
                <button
                  onClick={() => setIsParticipationOpen(true)}
                  className="text-left sm:text-right text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2 shrink-0 py-1 min-h-[36px] flex items-center"
                >
                  Switch Identity
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* CHALLENGE REQUIREMENTS & TIMELINE */}
        <section className="py-10 bg-slate-100/70 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Requirements Matrix */}
              <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <FileText className="h-4 w-4 text-slate-700" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Challenge Guidelines & Submission Rules
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
                      Photo Documentation
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {event.minImages === event.maxImages
                        ? `Exactly ${event.minImages} high-resolution image`
                        : `${event.minImages} to ${event.maxImages} photos allowed`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      JPG, PNG, or WebP showing model details, prototype assembly, or finished build.
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
                      Description Requirement
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      Minimum {event.minDescriptionChars || 100} characters
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Explain design intent, materials, tools used, and technical considerations.
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
                      Peer Voting Quota
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {event.votesPerParticipant === 1
                        ? "1 vote per participant"
                        : `${event.votesPerParticipant} votes per participant`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {event.selfVotingAllowed
                        ? "Self-voting is allowed in this challenge."
                        : "Self-voting is strictly prohibited."}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
                      Winner Recognition
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      Top {event.numberOfWinners || 1} Ranked {event.numberOfWinners === 1 ? "Project" : "Projects"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Ranked by peer vote count with official winner certificate and SAC Activity Points.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Col: Timeline */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Clock className="h-4 w-4 text-slate-700" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Event Schedule
                  </h2>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Project Submissions</span>
                      <SubmissionStatusBadge
                        startAt={event.submissionStartAt}
                        endAt={event.submissionEndAt}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatDate(event.submissionStartAt)} — {formatDate(event.submissionEndAt)}
                    </div>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Peer Voting Window</span>
                      <VotingStateBadge state={event.votingState} />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatDate(event.votingStartAt)} — {formatDate(event.votingEndAt)}
                    </div>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-slate-100">
                    <span className="font-bold text-slate-800 block">Event Venue / Location</span>
                    <span className="text-[11px] text-slate-600 block">
                      {event.venue || "Robotics Club Lab / Makerspace"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVE PARTICIPANT SUBMISSION REVIEW CARD */}
        {mySubmission && (
          <section id="my-submission" className="py-8 bg-blue-50/40 border-b border-blue-200/60">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Your Project Submission
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <SubmissionItemStatusBadge status={mySubmission.status} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {mySubmission.images && mySubmission.images[0] ? (
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={mySubmission.images[0].imageUrl}
                        alt={mySubmission.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="md:col-span-3 space-y-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {mySubmission.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {mySubmission.description}
                    </p>

                    {mySubmission.adminFeedback ? (
                      <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                        <strong>Review Feedback:</strong> {mySubmission.adminFeedback}
                      </div>
                    ) : null}

                    <div className="pt-2 text-[11px] text-slate-500">
                      {mySubmission.status === "published"
                        ? "Your project is published in the gallery and participating in peer voting."
                        : mySubmission.status === "submitted"
                        ? "Your project is under review by club moderators before being published to the gallery."
                        : mySubmission.status === "rejected"
                        ? "This submission requires modifications as noted in the feedback above."
                        : "Your submission is currently in draft status."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PROJECT GALLERY */}
        <section id="gallery" className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Gallery Header & Voting Status Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Project Gallery
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {submissions.length} published
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Browse verified projects submitted by participants for this challenge.
                </p>
              </div>

              {/* Live Voting Quota Banner */}
              <div className="flex items-center space-x-3">
                {isVotingActive ? (
                  activeParticipant ? (
                    <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-900">
                      Votes used:{" "}
                      <strong className="text-blue-700">
                        {votesUsed} / {votesAllowed}
                      </strong>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsParticipationOpen(true)}
                      className="inline-flex items-center space-x-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
                    >
                      <Vote className="h-4 w-4" />
                      <span>Participate to Vote</span>
                    </button>
                  )
                ) : null}

                <button
                  onClick={reloadEventData}
                  disabled={isRefreshing}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Refresh gallery"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Submissions Grid */}
            {submissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-md mx-auto space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  No projects have been published yet.
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Projects will appear here once participant submissions are reviewed and published by coordinators.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {submissions.map((sub) => {
                  const hasVoted = votedSubmissionIds.has(sub.id);
                  const isSelf =
                    activeParticipant && sub.participantId === activeParticipant.id;
                  const primaryImage =
                    sub.images && sub.images[0] ? sub.images[0].imageUrl : null;

                  return (
                    <article
                      key={sub.id}
                      className="group flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden hover:border-slate-300"
                    >
                      {/* Project Image */}
                      <div
                        onClick={() => setSelectedProject(sub)}
                        className="relative aspect-16/10 w-full overflow-hidden bg-slate-900 cursor-pointer"
                      >
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={sub.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-900 flex items-center justify-center text-xs text-slate-500">
                            No Image
                          </div>
                        )}

                        {/* Top Overlay Badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          {sub.winnerRank ? (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-950 shadow-md">
                              <Award className="h-3 w-3" />
                              <span>WINNER #{sub.winnerRank}</span>
                            </span>
                          ) : (
                            <span />
                          )}

                          {/* Vote count pill (ONLY IF showVoteCounts === true) */}
                          {event.showVoteCounts && sub.voteCount !== undefined ? (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-slate-900/80 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/10 shadow-xs">
                              <Vote className="h-3 w-3 text-amber-400" />
                              <span>{sub.voteCount}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                        <div className="space-y-2">
                          <h3
                            onClick={() => setSelectedProject(sub)}
                            className="text-base font-bold text-slate-900 tracking-tight hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                          >
                            {sub.title}
                          </h3>

                          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium text-slate-700 truncate">
                              {sub.participantName || "Robotics Club Participant"}
                            </span>
                            {isSelf ? (
                              <span className="rounded-full bg-blue-50 px-2 py-0.2 text-[10px] font-bold text-blue-700">
                                You
                              </span>
                            ) : null}
                          </div>

                          <p
                            onClick={() => setSelectedProject(sub)}
                            className="text-xs text-slate-600 leading-relaxed line-clamp-2 cursor-pointer"
                          >
                            {sub.description}
                          </p>
                        </div>

                        {/* Card Voting Footer */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setSelectedProject(sub)}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors py-2 px-1 min-h-[44px]"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Inspect</span>
                          </button>

                          {/* Voting Button states */}
                          {!isVotingActive ? (
                            <span className="text-[11px] font-semibold text-slate-400 py-2">
                              {event.votingState === "NOT_STARTED"
                                ? "Voting Soon"
                                : event.votingState === "PAUSED"
                                ? "Voting Paused"
                                : "Voting Ended"}
                            </span>
                          ) : !activeParticipant ? (
                            <button
                              onClick={() => setIsParticipationOpen(true)}
                              className="inline-flex items-center space-x-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors min-h-[44px]"
                            >
                              <Vote className="h-4 w-4" />
                              <span>Vote</span>
                            </button>
                          ) : isSelf && !event.selfVotingAllowed ? (
                            <span className="text-[11px] font-medium text-slate-400 py-2">
                              Own Project
                            </span>
                          ) : hasVoted ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 min-h-[44px]">
                                <Check className="h-4 w-4 text-emerald-600" />
                                <span>Voted</span>
                              </span>
                              <button
                                onClick={() => handleRemoveVote(sub.id)}
                                disabled={isVotePending}
                                className="text-xs text-slate-400 hover:text-rose-600 underline underline-offset-2 px-2 py-2 min-h-[44px] flex items-center"
                              >
                                Undo
                              </button>
                            </div>
                          ) : canVoteMore ? (
                            <button
                              onClick={() => handleVote(sub.id)}
                              disabled={isVotePending}
                              className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-600 transition-colors disabled:opacity-50 min-h-[44px]"
                            >
                              <Vote className="h-4 w-4" />
                              <span>Vote</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 py-2">
                              Limit Reached
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Participation Modal */}
      <PublicParticipationModal
        isOpen={isParticipationOpen}
        onClose={() => setIsParticipationOpen(false)}
        eventId={event.id}
        onParticipantEstablished={handleParticipantEstablished}
      />

      {/* Submission Modal */}
      {activeParticipant ? (
        <PublicSubmissionModal
          isOpen={isSubmissionModalOpen}
          onClose={() => setIsSubmissionModalOpen(false)}
          event={event}
          participantId={activeParticipant.id}
          participantDisplayName={activeParticipant.displayName}
          onSubmissionSuccess={(newSub) => {
            setMySubmission(newSub);
            reloadEventData();
          }}
        />
      ) : null}

      {/* Project Detail Lightbox Modal */}
      <PublicProjectDetailModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        submission={selectedProject}
        event={event}
        currentParticipantId={activeParticipant?.id || null}
        hasVotedForThis={selectedProject ? votedSubmissionIds.has(selectedProject.id) : false}
        canVote={canVoteMore}
        isVotingActive={isVotingActive}
        isSelfSubmission={
          !!(selectedProject && activeParticipant && selectedProject.participantId === activeParticipant.id)
        }
        onVote={handleVote}
        onRemoveVote={handleRemoveVote}
        isVotePending={isVotePending}
        onOpenParticipation={() => setIsParticipationOpen(true)}
      />
    </div>
  );
}
