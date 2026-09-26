"use client";

import React, { useState, useEffect, useTransition } from "react";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Button } from "@/components/ui/button";
import { EventSelect } from "@/db/schema";
import {
  updateCompetitionEventAction,
  uploadEventCoverImageAction,
} from "@/actions/events/club-events.actions";
import {
  Settings,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
} from "lucide-react";

interface EditEventDrawerProps {
  event: EventSelect | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEventDrawer({
  event,
  isOpen,
  onClose,
  onSuccess,
}: EditEventDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);

  // Submission Config
  const [submissionStartAt, setSubmissionStartAt] = useState("");
  const [submissionEndAt, setSubmissionEndAt] = useState("");
  const [minImages, setMinImages] = useState(1);
  const [maxImages, setMaxImages] = useState(2);
  const [minDescriptionChars, setMinDescriptionChars] = useState(100);

  // Voting Config
  const [votingStartAt, setVotingStartAt] = useState("");
  const [votingEndAt, setVotingEndAt] = useState("");
  const [votesPerParticipant, setVotesPerParticipant] = useState(1);
  const [selfVotingAllowed, setSelfVotingAllowed] = useState(false);
  const [showVoteCounts, setShowVoteCounts] = useState(false);
  const [numberOfWinners, setNumberOfWinners] = useState(1);

  useEffect(() => {
    if (event) {
      setName(event.name || "");
      setDescription(event.description || "");
      setCoverImageUrl(event.coverImageUrl || "");
      setSubmissionStartAt(
        event.submissionStartAt
          ? new Date(event.submissionStartAt).toISOString().slice(0, 16)
          : ""
      );
      setSubmissionEndAt(
        event.submissionEndAt
          ? new Date(event.submissionEndAt).toISOString().slice(0, 16)
          : ""
      );
      setMinImages(event.minImages ?? 1);
      setMaxImages(event.maxImages ?? 2);
      setMinDescriptionChars(event.minDescriptionChars ?? 100);
      setVotingStartAt(
        event.votingStartAt
          ? new Date(event.votingStartAt).toISOString().slice(0, 16)
          : ""
      );
      setVotingEndAt(
        event.votingEndAt
          ? new Date(event.votingEndAt).toISOString().slice(0, 16)
          : ""
      );
      setVotesPerParticipant(event.votesPerParticipant ?? 1);
      setSelfVotingAllowed(Boolean(event.selfVotingAllowed));
      setShowVoteCounts(Boolean(event.showVoteCounts));
      setNumberOfWinners(event.numberOfWinners ?? 1);
      setFeedback(null);
    }
  }, [event]);

  if (!event) return null;

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", event.id);

      const res = await uploadEventCoverImageAction(formData);
      if (res.success && res.data) {
        setCoverImageUrl(res.data.imageUrl);
        setFeedback({ type: "success", message: "Cover image uploaded successfully." });
      } else {
        setFeedback({ type: "error", message: res.error?.message || "Failed to upload cover image." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to upload cover image." });
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Client Validation
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Event Name is required." });
      return;
    }
    if (submissionStartAt && submissionEndAt && new Date(submissionEndAt) <= new Date(submissionStartAt)) {
      setFeedback({ type: "error", message: "Submission End date must be after Submission Start date." });
      return;
    }
    if (votingStartAt && votingEndAt && new Date(votingEndAt) <= new Date(votingStartAt)) {
      setFeedback({ type: "error", message: "Voting End date must be after Voting Start date." });
      return;
    }
    if (minImages > maxImages) {
      setFeedback({ type: "error", message: "Minimum images cannot be greater than Maximum images." });
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateCompetitionEventAction(event.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          coverImageUrl: coverImageUrl.trim() || null,
          submissionStartAt: submissionStartAt ? new Date(submissionStartAt) : null,
          submissionEndAt: submissionEndAt ? new Date(submissionEndAt) : null,
          minImages: Number(minImages),
          maxImages: Number(maxImages),
          minDescriptionChars: Number(minDescriptionChars),
          votingStartAt: votingStartAt ? new Date(votingStartAt) : null,
          votingEndAt: votingEndAt ? new Date(votingEndAt) : null,
          votesPerParticipant: Number(votesPerParticipant),
          selfVotingAllowed: Boolean(selfVotingAllowed),
          showVoteCounts: Boolean(showVoteCounts),
          numberOfWinners: Number(numberOfWinners),
        });

        if (res.success) {
          setFeedback({ type: "success", message: "Event configuration updated successfully!" });
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        } else {
          setFeedback({ type: "error", message: res.error?.message || "Failed to update event." });
        }
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "An unexpected error occurred." });
      }
    });
  };

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title={`Configure ${event.name}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Drawer Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Configure Event</h2>
              <p className="text-xs text-muted-foreground">{event.name}</p>
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

        {/* Drawer Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
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
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="opacity-70 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Section 1: General */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              General Information
            </h3>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Event Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Cover Image Upload / URL */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Cover Image</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="Paste image URL or upload image"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-secondary/80 transition-colors text-xs font-medium">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{coverUploading ? "Uploading..." : "Upload New"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCoverUpload}
                    disabled={coverUploading}
                  />
                </label>
              </div>
              {coverImageUrl && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-border max-h-36">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl("")}
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
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Submissions Window &amp; Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Submission Opens</label>
                <input
                  type="datetime-local"
                  value={submissionStartAt}
                  onChange={(e) => setSubmissionStartAt(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Submission Closes</label>
                <input
                  type="datetime-local"
                  value={submissionEndAt}
                  onChange={(e) => setSubmissionEndAt(e.target.value)}
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
                  value={minImages}
                  onChange={(e) => setMinImages(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Max Images</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxImages}
                  onChange={(e) => setMaxImages(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Min Chars</label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={minDescriptionChars}
                  onChange={(e) => setMinDescriptionChars(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Section 3: Voting & Results */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Voting Window &amp; Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Voting Starts</label>
                <input
                  type="datetime-local"
                  value={votingStartAt}
                  onChange={(e) => setVotingStartAt(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Voting Ends</label>
                <input
                  type="datetime-local"
                  value={votingEndAt}
                  onChange={(e) => setVotingEndAt(e.target.value)}
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
                  value={votesPerParticipant}
                  onChange={(e) => setVotesPerParticipant(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Number of Winners</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={numberOfWinners}
                  onChange={(e) => setNumberOfWinners(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selfVotingAllowed}
                  onChange={(e) => setSelfVotingAllowed(e.target.checked)}
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
                  checked={showVoteCounts}
                  onChange={(e) => setShowVoteCounts(e.target.checked)}
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
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border bg-card/60 flex items-center justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || coverUploading}
            size="sm"
            className="text-xs font-bold gap-1"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </DetailDrawer>
  );
}
