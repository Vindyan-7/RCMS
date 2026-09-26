"use client";

import React, { useState, useTransition } from "react";
import {
  resolveMemberForEventAction,
  registerMemberParticipantAction,
  registerFresherParticipantAction,
} from "@/actions/events/club-events.actions";
import { PublicMemberProfile } from "@/services/events";
import { EventParticipantSelect } from "@/db/schema";
import {
  X,
  UserCheck,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  Search,
  Check,
} from "lucide-react";

interface PublicParticipationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onParticipantEstablished: (participant: EventParticipantSelect, displayName: string) => void;
}

type IdentityTab = "choice" | "member_lookup" | "member_confirm" | "fresher";

export function PublicParticipationModal({
  isOpen,
  onClose,
  eventId,
  onParticipantEstablished,
}: PublicParticipationModalProps) {
  const [tab, setTab] = useState<IdentityTab>("choice");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  // Member flow states
  const [membershipQuery, setMembershipQuery] = useState("");
  const [resolvedMember, setResolvedMember] = useState<PublicMemberProfile | null>(null);

  // Fresher flow states
  const [fresherName, setFresherName] = useState("");
  const [fresherMobile, setFresherMobile] = useState("");

  if (!isOpen) return null;

  const resetFlow = () => {
    setTab("choice");
    setErrorMessage("");
    setMembershipQuery("");
    setResolvedMember(null);
    setFresherName("");
    setFresherMobile("");
  };

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  // 1. Resolve Member lookup
  const handleMemberLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const query = membershipQuery.trim();
    if (!query || query.length < 2) {
      setErrorMessage("Please enter your SAC Membership ID or Roll Number.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await resolveMemberForEventAction({
          eventId,
          membershipId: query,
        });

        if (res.success && res.data) {
          setResolvedMember(res.data);
          setTab("member_confirm");
        } else {
          setErrorMessage(
            res.error?.message ||
              "Could not find an active club membership with that ID or Roll Number."
          );
        }
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred during member lookup.");
      }
    });
  };

  // 2. Confirm & Register Member
  const handleMemberRegister = () => {
    if (!resolvedMember) return;
    setErrorMessage("");

    startTransition(async () => {
      try {
        const res = await registerMemberParticipantAction({
          eventId,
          memberId: resolvedMember.id,
        });

        if (res.success && res.data) {
          onParticipantEstablished(res.data, resolvedMember.name);
          handleClose();
        } else {
          setErrorMessage(res.error?.message || "Failed to register member participant.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred.");
      }
    });
  };

  // 3. Register Fresher
  const handleFresherRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const name = fresherName.trim();
    if (!name || name.length < 2) {
      setErrorMessage("Please enter your full name (minimum 2 characters).");
      return;
    }

    const cleanMobile = fresherMobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await registerFresherParticipantAction({
          eventId,
          fullName: name,
          mobileNumber: cleanMobile,
        });

        if (res.success && res.data) {
          onParticipantEstablished(res.data, name);
          handleClose();
        } else {
          setErrorMessage(
            res.error?.message || "Failed to register participant for this event."
          );
        }
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 sm:px-6 py-3.5 sm:py-4 shrink-0">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900">
              Event Participation
            </h2>
            <p className="text-xs text-slate-500">
              Identify yourself to submit projects and participate in voting
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Error Alert */}
          {errorMessage ? (
            <div className="flex items-start space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          ) : null}

          {/* STEP 1: CHOICE SCREEN */}
          {tab === "choice" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Are you an official Robotics Club member? Select an option below to proceed:
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => {
                    setErrorMessage("");
                    setTab("member_lookup");
                  }}
                  className="group flex items-start space-x-3.5 rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-600 hover:bg-blue-50/40 transition-all shadow-xs min-h-[64px]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Official Club Member
                    </div>
                    <div className="text-[11px] text-slate-500 leading-relaxed">
                      I have an SAC Membership ID or college Roll Number registered with the club.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setErrorMessage("");
                    setTab("fresher");
                  }}
                  className="group flex items-start space-x-3.5 rounded-2xl border border-slate-200 p-4 text-left hover:border-indigo-600 hover:bg-indigo-50/40 transition-all shadow-xs min-h-[64px]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Fresher / Non-Member
                    </div>
                    <div className="text-[11px] text-slate-500 leading-relaxed">
                      I am not a registered club member yet, but want to participate in this open challenge.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2A: MEMBER LOOKUP */}
          {tab === "member_lookup" && (
            <form onSubmit={handleMemberLookup} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="membershipQuery"
                  className="block text-xs font-semibold text-slate-700"
                >
                  SAC Membership ID or Roll Number
                </label>
                <div className="relative">
                  <input
                    id="membershipQuery"
                    type="text"
                    required
                    placeholder="e.g. SAC-2026-0042 or 21EC084"
                    value={membershipQuery}
                    onChange={(e) => setMembershipQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base sm:text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden uppercase tracking-wider min-h-[44px]"
                  />
                  <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Enter your official membership ID or roll number to resolve your verified club record.
                </p>
              </div>

              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setTab("choice");
                  }}
                  className="w-1/2 rounded-xl border border-slate-200 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-1/2 inline-flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 py-3 text-xs sm:text-sm font-bold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <span>{isPending ? "Searching..." : "Lookup Profile"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2B: MEMBER CONFIRMATION */}
          {tab === "member_confirm" && resolvedMember && (
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50/60 border border-blue-200/80 p-4 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-900">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Verified Club Member Record</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-blue-100">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Name
                    </span>
                    <span className="font-bold text-slate-900 truncate block">
                      {resolvedMember.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Department
                    </span>
                    <span className="font-medium text-slate-700 truncate block">
                      {resolvedMember.branch || "Engineering"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Roll Number
                    </span>
                    <span className="font-medium text-slate-700 truncate block">
                      {resolvedMember.rollNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Membership ID
                    </span>
                    <span className="font-medium text-slate-700 truncate block">
                      {resolvedMember.clubMembershipId || "Official Member"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Confirming participation binds your official membership identity to this event. You will submit projects and vote under your verified member profile.
              </p>

              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setTab("member_lookup");
                  }}
                  className="w-1/3 rounded-xl border border-slate-200 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleMemberRegister}
                  disabled={isPending}
                  className="w-2/3 inline-flex items-center justify-center space-x-1.5 rounded-xl bg-blue-600 py-3 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <Check className="h-4 w-4" />
                  <span>{isPending ? "Confirming..." : "Confirm & Participate"}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2C: FRESHER REGISTRATION */}
          {tab === "fresher" && (
            <form onSubmit={handleFresherRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="fresherName"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="fresherName"
                  type="text"
                  required
                  placeholder="e.g. Alex Sharma"
                  value={fresherName}
                  onChange={(e) => setFresherName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base sm:text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="fresherMobile"
                  className="block text-xs font-semibold text-slate-700"
                >
                  10-Digit Mobile Number
                </label>
                <div className="relative">
                  <input
                    id="fresherMobile"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={fresherMobile}
                    onChange={(e) => setFresherMobile(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base sm:text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden min-h-[44px]"
                  />
                  <Phone className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Your phone number is used strictly for identity verification and anti-abuse protection. It will never be publicly displayed.
                </p>
              </div>

              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setTab("choice");
                  }}
                  className="w-1/3 rounded-xl border border-slate-200 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-2/3 inline-flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 py-3 text-xs sm:text-sm font-bold text-white hover:bg-indigo-600 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isPending ? "Registering..." : "Register & Participate"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
