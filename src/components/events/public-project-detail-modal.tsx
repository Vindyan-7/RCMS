"use client";

import React, { useState } from "react";
import { SubmissionWithImages } from "@/services/events";
import { EventSelect } from "@/db/schema";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Vote,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  Award,
} from "lucide-react";

interface PublicProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionWithImages | null;
  event: EventSelect;
  currentParticipantId: string | null;
  hasVotedForThis: boolean;
  canVote: boolean;
  isVotingActive: boolean;
  isSelfSubmission: boolean;
  onVote: (submissionId: string) => Promise<void>;
  onRemoveVote: (submissionId: string) => Promise<void>;
  isVotePending: boolean;
  onOpenParticipation: () => void;
}

export function PublicProjectDetailModal({
  isOpen,
  onClose,
  submission,
  event,
  currentParticipantId,
  hasVotedForThis,
  canVote,
  isVotingActive,
  isSelfSubmission,
  onVote,
  onRemoveVote,
  isVotePending,
  onOpenParticipation,
}: PublicProjectDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !submission) return null;

  const images = submission.images && submission.images.length > 0 ? submission.images : [];
  const currentImage = images[activeImageIndex] || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col max-h-[92dvh] sm:max-h-[88dvh] w-full max-w-3xl overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 sm:px-6 py-3.5 sm:py-4 bg-white shrink-0">
          <div className="space-y-0.5 max-w-[80%]">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {submission.title}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-700 truncate max-w-[160px] sm:max-w-none">
                  {submission.participantName || "Robotics Club Participant"}
                </span>
              </span>
              {submission.winnerRank ? (
                <span className="inline-flex items-center space-x-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  <Award className="h-3 w-3 text-amber-600" />
                  <span>Winner #{submission.winnerRank}</span>
                </span>
              ) : null}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Image Gallery */}
          {images.length > 0 ? (
            <div className="space-y-3">
              <div className="relative aspect-video sm:aspect-16/10 w-full overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
                {currentImage ? (
                  <img
                    src={currentImage.imageUrl}
                    alt={`${submission.title} image ${activeImageIndex + 1}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-slate-500">No preview available</div>
                )}

                {/* Left/Right Navigation buttons for multi-image */}
                {images.length > 1 ? (
                  <>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                      }
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors touch-manipulation"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors touch-manipulation"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </div>

              {/* Thumbnails strip if multiple */}
              {images.length > 1 ? (
                <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImageIndex === idx
                          ? "border-blue-600 ring-2 ring-blue-100"
                          : "border-slate-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.imageUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Project Description
            </h3>
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {submission.description}
            </div>
          </div>
        </div>

        {/* Footer with Voting Controls */}
        <div className="border-t border-slate-200 p-4 sm:p-6 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Vote tally information (respects showVoteCounts) */}
          <div className="text-xs text-slate-500 text-center sm:text-left">
            {event.showVoteCounts && submission.voteCount !== undefined ? (
              <span className="font-semibold text-slate-900">
                {submission.voteCount} {submission.voteCount === 1 ? "peer vote" : "peer votes"}
              </span>
            ) : (
              <span>Peer voting open to event participants</span>
            )}
          </div>

          {/* Voting Action Buttons */}
          <div className="w-full sm:w-auto flex items-center justify-end space-x-2">
            {!isVotingActive ? (
              <div className="w-full sm:w-auto text-center text-xs font-medium text-slate-400 px-3 py-2.5 bg-slate-100 rounded-xl">
                {event.votingState === "NOT_STARTED"
                  ? "Voting has not started yet"
                  : event.votingState === "PAUSED"
                  ? "Voting is currently paused"
                  : "Voting has ended"}
              </div>
            ) : !currentParticipantId ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenParticipation();
                }}
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center space-x-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                <Vote className="h-4 w-4" />
                <span>Participate to Vote</span>
              </button>
            ) : isSelfSubmission && !event.selfVotingAllowed ? (
              <span className="w-full sm:w-auto text-center text-xs font-semibold text-slate-500 bg-slate-100 rounded-xl px-3 py-2.5">
                Self-voting not allowed
              </span>
            ) : hasVotedForThis ? (
              <div className="flex items-center justify-between sm:justify-end space-x-2 w-full sm:w-auto">
                <span className="min-h-[44px] inline-flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 flex-1 sm:flex-initial">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Voted</span>
                </span>
                <button
                  onClick={() => onRemoveVote(submission.id)}
                  disabled={isVotePending}
                  className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  Remove Vote
                </button>
              </div>
            ) : canVote ? (
              <button
                onClick={() => onVote(submission.id)}
                disabled={isVotePending}
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <Vote className="h-4 w-4" />
                <span>{isVotePending ? "Recording Vote..." : "Vote for this Project"}</span>
              </button>
            ) : (
              <span className="w-full sm:w-auto text-center text-xs font-medium text-slate-400 px-3 py-2.5 bg-slate-100 rounded-xl">
                Vote Limit Reached
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
