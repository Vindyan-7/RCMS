"use client";

import React, { useState, useTransition } from "react";
import {
  uploadSubmissionImageAction,
  submitProjectAction,
} from "@/actions/events/club-events.actions";
import { EventSelect } from "@/db/schema";
import { SubmissionWithImages } from "@/services/events";
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
} from "lucide-react";

interface PublicSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventSelect;
  participantId: string;
  participantDisplayName: string;
  onSubmissionSuccess: (submission: SubmissionWithImages) => void;
}

interface UploadedImageItem {
  imageUrl: string;
  storagePath: string;
  fileSizeBytes?: number;
  mimeType?: string;
  displayOrder: number;
}

type SubmissionStep = "form" | "review" | "success";

export function PublicSubmissionModal({
  isOpen,
  onClose,
  event,
  participantId,
  participantDisplayName,
  onSubmissionSuccess,
}: PublicSubmissionModalProps) {
  const [step, setStep] = useState<SubmissionStep>("form");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<UploadedImageItem[]>([]);

  // Created submission for success display
  const [createdSubmission, setCreatedSubmission] = useState<SubmissionWithImages | null>(null);

  if (!isOpen) return null;

  const minImages = event.minImages || 1;
  const maxImages = event.maxImages || 2;
  const minDescriptionChars = event.minDescriptionChars || 100;

  const handleClose = () => {
    if (step === "success") {
      onClose();
      setStep("form");
      setTitle("");
      setDescription("");
      setImages([]);
      setErrorMessage("");
    } else {
      onClose();
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= maxImages) {
      setErrorMessage(`Maximum limit of ${maxImages} images reached.`);
      return;
    }

    setErrorMessage("");
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        if (images.length + i >= maxImages) break;

        const file = files[i];

        // Format check
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
          setErrorMessage("Only JPG, PNG, and WebP images are allowed.");
          continue;
        }

        // Size check: 5MB
        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage("Each image file must be smaller than 5MB.");
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("eventId", event.id);
        formData.append("participantId", participantId);

        const res = await uploadSubmissionImageAction(formData);
        if (res.success && res.data) {
          setImages((prev) => [
            ...prev,
            {
              imageUrl: res.data!.imageUrl,
              storagePath: res.data!.storagePath,
              fileSizeBytes: res.data!.fileSizeBytes,
              mimeType: res.data!.mimeType,
              displayOrder: prev.length,
            },
          ]);
        } else {
          setErrorMessage(res.error?.message || "Failed to upload image.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during image upload.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) =>
      prev
        .filter((_, idx) => idx !== indexToRemove)
        .map((img, idx) => ({ ...img, displayOrder: idx }))
    );
  };

  // Validate and move to Review step
  const handleGoToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2) {
      setErrorMessage("Project title must be at least 2 characters.");
      return;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc.length < minDescriptionChars) {
      setErrorMessage(
        `Description must be at least ${minDescriptionChars} characters (currently ${trimmedDesc.length} characters).`
      );
      return;
    }

    if (images.length < minImages) {
      setErrorMessage(`Please upload at least ${minImages} project image.`);
      return;
    }

    setStep("review");
  };

  // Final Submission to Server
  const handleFinalSubmit = () => {
    setErrorMessage("");

    startTransition(async () => {
      try {
        const res = await submitProjectAction({
          eventId: event.id,
          participantId,
          title: title.trim(),
          description: description.trim(),
          images,
        });

        if (res.success && res.data) {
          setCreatedSubmission(res.data);
          onSubmissionSuccess(res.data);
          setStep("success");
        } else {
          setErrorMessage(
            res.error?.message || "Failed to submit project. Please verify your inputs."
          );
          setStep("form");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred during submission.");
        setStep("form");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative flex flex-col max-h-[92vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900">
              {step === "success"
                ? "Submission Received"
                : step === "review"
                ? "Review Your Project"
                : "Submit Your Project"}
            </h2>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <span>Author:</span>
              <span className="font-semibold text-slate-700">
                {participantDisplayName}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage ? (
          <div className="mx-6 mt-4 flex items-start space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        ) : null}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: FORM */}
          {step === "form" && (
            <form onSubmit={handleGoToReview} className="space-y-5">
              {/* Project Title */}
              <div className="space-y-1.5">
                <label
                  htmlFor="projectTitle"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Project Title *
                </label>
                <input
                  id="projectTitle"
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. Autonomous Robotic Arm with 4-DOF Gripper"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
                />
              </div>

              {/* Description with Live Character Count */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="projectDescription"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Technical Description *
                  </label>
                  <span
                    className={`text-[11px] font-semibold ${
                      description.trim().length >= minDescriptionChars
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {description.trim().length} / {minDescriptionChars} characters minimum
                  </span>
                </div>
                <textarea
                  id="projectDescription"
                  rows={4}
                  required
                  placeholder="Describe your design, hardware specifications, mechanics, software stack, and what makes your project innovative..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden leading-relaxed"
                />
              </div>

              {/* Image Upload Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Project Images *
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {images.length} of {maxImages} images uploaded
                  </span>
                </div>

                {/* Previews */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-4/3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 group"
                      >
                        <img
                          src={img.imageUrl}
                          alt={`Uploaded image ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 rounded-lg bg-rose-600/90 p-1.5 text-white hover:bg-rose-700 transition-colors shadow-xs"
                          aria-label="Remove image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Upload Button area if images < max */}
                {images.length < maxImages ? (
                  <label className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-blue-500 hover:bg-blue-50/20 transition-all cursor-pointer bg-slate-50/50">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2">
                      <Upload className={`h-5 w-5 ${isUploading ? "animate-bounce" : ""}`} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800">
                        {isUploading ? "Uploading image..." : "Upload Project Photo"}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        JPG, PNG, or WebP up to 5MB ({minImages}–{maxImages} photos required)
                      </p>
                    </div>
                  </label>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isUploading ||
                    images.length < minImages ||
                    description.trim().length < minDescriptionChars ||
                    !title.trim()
                  }
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <span>Review Submission</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: REVIEW */}
          {step === "review" && (
            <div className="space-y-5">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                    Project Title
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                    Description ({description.trim().length} characters)
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                    Images ({images.length})
                  </span>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative h-16 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200"
                      >
                        <img
                          src={img.imageUrl}
                          alt={`Preview ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50/60 border border-blue-200/80 p-3.5 text-xs text-blue-900 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>Important Notice Before Submitting</span>
                </div>
                <p className="text-[11px] text-blue-800/80 leading-relaxed">
                  Each participant may only submit one project per event. Once submitted, your project will be reviewed by Robotics Club moderators before being published in the public gallery.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  disabled={isPending}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isPending}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isPending ? "Submitting Project..." : "Confirm & Submit Project"}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>

              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-slate-900">
                  Submission Received!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your project has been successfully submitted to the Robotics Club event.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="font-semibold text-slate-800">Next Steps:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>Your submission is now queued for moderation.</li>
                  <li>Once approved by club coordinators, it will appear in the public Project Gallery.</li>
                  <li>Peer voting will unlock once the event enters the active voting phase.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <span>Return to Challenge</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
