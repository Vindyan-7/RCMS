"use client";

import React, { useState } from "react";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubmissionWithImages } from "@/services/events";
import { SubmissionItemStatusBadge } from "./event-status-badge";
import {
  FileText,
  User,
  Vote,
  Calendar,
  X,
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  Trophy,
  ExternalLink,
} from "lucide-react";

interface SubmissionDetailDrawerProps {
  submission: SubmissionWithImages | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (
    submissionId: string,
    status: "published" | "rejected" | "hidden",
    feedback?: string
  ) => Promise<void>;
  isUpdating: boolean;
}

export function SubmissionDetailDrawer({
  submission,
  isOpen,
  onClose,
  onStatusChange,
  isUpdating,
}: SubmissionDetailDrawerProps) {
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  if (!submission) return null;

  const handlePublish = async () => {
    await onStatusChange(submission.id, "published");
  };

  const handleHide = async () => {
    await onStatusChange(submission.id, "hidden");
  };

  const handleRejectConfirm = async () => {
    await onStatusChange(submission.id, "rejected", rejectFeedback.trim() || undefined);
    setIsRejecting(false);
    setRejectFeedback("");
  };

  const isMember = (submission as any).participantType === "member";
  const participantTypeLabel = isMember ? "Official Member" : "Fresher";

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not recorded";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <DetailDrawer
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-2xl"
        title="Project Submission Workspace"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-start justify-between bg-card/60">
            <div className="space-y-1 pr-4">
              <div className="flex items-center space-x-2">
                <SubmissionItemStatusBadge status={submission.status} />
                {submission.winnerRank && (
                  <Badge variant="warning" className="gap-1 font-bold">
                    <Trophy className="h-3 w-3" />
                    <span>Rank #{submission.winnerRank} Winner</span>
                  </Badge>
                )}
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight pt-1">
                {submission.title}
              </h2>
              <div className="flex items-center space-x-3 text-xs text-muted-foreground pt-1">
                <span className="flex items-center space-x-1">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">
                    {submission.participantName || "Participant"}
                  </span>
                </span>
                <span>•</span>
                <Badge variant={isMember ? "default" : "outline"} className="text-[10px]">
                  {participantTypeLabel}
                </Badge>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/20 border border-border rounded-xl">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
                  Peer Votes
                </span>
                <span className="text-base font-bold text-foreground flex items-center space-x-1 mt-0.5">
                  <Vote className="h-4 w-4 text-primary" />
                  <span>{submission.voteCount ?? 0}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
                  Submitted On
                </span>
                <span className="text-xs font-semibold text-foreground flex items-center space-x-1 mt-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{formatDate(submission.createdAt)}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
                  Images Attached
                </span>
                <span className="text-base font-bold text-foreground mt-0.5 block">
                  {submission.images?.length || 0} photo(s)
                </span>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Project Description
              </h3>
              <div className="p-4 bg-background border border-border rounded-xl whitespace-pre-wrap leading-relaxed text-foreground text-xs font-sans">
                {submission.description}
              </div>
            </div>

            {/* Project Photos Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Submitted Images ({submission.images?.length || 0})
                </h3>
                <span className="text-[11px] text-muted-foreground">Click photo to zoom</span>
              </div>

              {submission.images && submission.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {submission.images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      onClick={() => setSelectedImageModal(img.imageUrl)}
                      className="group relative rounded-xl border border-border overflow-hidden bg-muted/30 aspect-video cursor-pointer hover:border-primary/50 transition-all shadow-xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.imageUrl}
                        alt={`${submission.title} photo ${idx + 1}`}
                        className="w-full h-full object-contain p-1 group-hover:scale-102 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View Full Image</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No images attached.</p>
              )}
            </div>

            {/* Admin Feedback (If Rejected or has feedback) */}
            {submission.adminFeedback && (
              <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Admin Feedback / Review Notes</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {submission.adminFeedback}
                </p>
              </div>
            )}

            {/* Rejection input box */}
            {isRejecting && (
              <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/5 space-y-3">
                <div className="font-bold text-red-400 text-xs">
                  Reject Submission &amp; Provide Reason
                </div>
                <textarea
                  rows={2}
                  value={rejectFeedback}
                  onChange={(e) => setRejectFeedback(e.target.value)}
                  placeholder="Explain why this project was rejected (e.g. low quality photos, guidelines not met)..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                />
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsRejecting(false);
                      setRejectFeedback("");
                    }}
                    disabled={isUpdating}
                    className="text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRejectConfirm}
                    disabled={isUpdating}
                    className="text-xs font-bold"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-border bg-card/60 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold"
            >
              Close
            </Button>

            <div className="flex items-center space-x-2">
              {submission.status !== "published" && (
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={isUpdating}
                  className="text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Publish / Approve</span>
                </Button>
              )}

              {submission.status !== "rejected" && !isRejecting && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsRejecting(true)}
                  disabled={isUpdating}
                  className="text-xs font-bold gap-1"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </Button>
              )}

              {submission.status !== "hidden" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleHide}
                  disabled={isUpdating}
                  className="text-xs font-semibold gap-1"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Hide</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DetailDrawer>

      {/* Lightbox / Zoom Modal */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImageModal}
              alt="Expanded preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-primary transition-colors flex items-center space-x-1 text-xs font-bold"
            >
              <X className="h-5 w-5" />
              <span>Close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
