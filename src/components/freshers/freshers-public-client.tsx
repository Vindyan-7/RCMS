"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  Zap,
  Sparkles,
  Trophy,
  ArrowRight,
  Star,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ChevronDown,
  ShieldCheck,
  Home,
  Send,
} from "lucide-react";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { MorphingText } from "@/components/freshers/morphing-text";
import { submitFreshersCampaignEntryAction } from "@/actions/freshers/freshers_public.actions";

interface FreshersPublicClientProps {
  campaign: {
    id: string;
    campaignKey: string;
    title: string;
    description: string;
    status: string;
  } | null;
}

export function FreshersPublicClient({ campaign }: FreshersPublicClientProps) {
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [stallRating, setStallRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const campaignKey = campaign?.campaignKey || "SVCE_FRESHERS_2026";
  const storageKey = `freshers_campaign_registered_${campaignKey}`;

  // Check one-time browser/device marker on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === "true") {
        setAlreadyRegistered(true);
      }
    } catch {}
  }, [storageKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage("Please enter a valid full name.");
      return;
    }

    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (stallRating < 1 || stallRating > 5) {
      setErrorMessage("Please select a stall rating (1 to 5 stars).");
      return;
    }

    setSubmitting(true);

    try {
      const res = await submitFreshersCampaignEntryAction({
        fullName: fullName.trim(),
        mobileNumber: cleanMobile,
        stallRating,
        feedback: feedback.trim() || undefined,
      });

      const resData = res.data;

      if (res.success && resData?.status === "registered") {
        try {
          localStorage.setItem(storageKey, "true");
        } catch {}
        setSubmittedSuccess(true);
      } else if (resData?.status === "already_registered") {
        try {
          localStorage.setItem(storageKey, "true");
        } catch {}
        setAlreadyRegistered(true);
      } else {
        setErrorMessage(
          resData?.message || res.error?.message || "We couldn't complete your registration. Please try again."
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Closed Campaign View
  if (!campaign || campaign.status === "closed") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
              <Bot className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaign Closed</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                The Robotics Club Freshers Lucky Draw & Recruitment Campaign has ended for this session. Thank you to everyone who participated!
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/about"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 px-5 py-3.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-md"
              >
                <Bot className="h-4 w-4" />
                <span>Explore Robotics Club</span>
              </Link>
              <Link
                href="/leaderboard"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-100 border border-slate-200 px-5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>View Leaderboard</span>
              </Link>
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Home className="h-4 w-4 text-slate-500" />
                <span>Return Home</span>
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // 2. Already Registered View (Duplicate Mobile or Second Visit)
  if (alreadyRegistered) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-4 py-12">
          <div className="w-full max-w-md bg-white border border-blue-200 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-xl shadow-blue-500/5 relative overflow-hidden">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-700 tracking-wide uppercase">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Verified Entry</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">You&apos;re Already Registered</h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                We&apos;ve already received an entry for this campaign from this mobile number.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-800">SVCE Robotics Club</p>
              <p className="text-[11px] text-slate-500">Thank you for connecting with the Robotics Club!</p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/about"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 px-5 py-3.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-md"
              >
                <Bot className="h-4 w-4" />
                <span>Explore Robotics Club</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/leaderboard"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-100 border border-slate-200 px-5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>View Leaderboard</span>
              </Link>
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Home className="h-4 w-4 text-slate-500" />
                <span>Return Home</span>
              </Link>
            </div>

            {process.env.NODE_ENV === "development" && (
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem(storageKey);
                  } catch {}
                  setAlreadyRegistered(false);
                }}
                className="text-[11px] font-semibold text-blue-600 hover:underline pt-2"
              >
                (Dev Mode: Clear Local Device Marker)
              </button>
            )}
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // 3. Success Confirmation View (First-Time Registration Result)
  if (submittedSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-4 py-12">
          <div className="w-full max-w-md bg-white border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-xl shadow-emerald-500/10 relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600" />

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-700 tracking-wide uppercase">
                <Zap className="h-3.5 w-3.5 text-emerald-600" />
                <span>Registration Confirmed</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Registration Successful!</h1>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Congratulations, your entry for the Robotics Club Freshers Campaign has been recorded successfully.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-800">You are now part of the Freshers Lucky Draw.</p>
              <p className="text-[11px] text-slate-500">Keep an eye out for draw announcements and club activities!</p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/about"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 px-5 py-3.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-md"
              >
                <Bot className="h-4 w-4" />
                <span>Explore Robotics Club</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/leaderboard"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-100 border border-slate-200 px-5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>View Leaderboard</span>
              </Link>
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Home className="h-4 w-4 text-slate-500" />
                <span>Return Home</span>
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // 4. Main Responsive Freshers Campaign Experience
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <PublicHeader />

      {/* Main Container - Fully responsive for mobile, tablet, laptop, and 4k desktop */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT / HERO SECTION */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-8 text-center lg:text-left">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <div className="inline-flex items-center space-x-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-bold text-blue-700">
                <Zap className="h-3.5 w-3.5 text-blue-600" />
                <span>SVCE Freshers Recruitment</span>
              </div>

              <div className="inline-flex items-center space-x-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-700">
                <Sparkles className="h-3 w-3 text-blue-600" />
                <span>Freshers 2026</span>
              </div>
            </div>

            {/* HERO HIERARCHY */}
            <div className="space-y-6">
              {/* 1. MORPHING TEXT IDENTITY */}
              <div className="py-2 mb-6 sm:mb-8">
                <MorphingText
                  texts={["ROBOTICS", "CLUB", "LUCKY DRAW", "REGISTER NOW"]}
                  className="text-amber-500 font-black tracking-wider"
                />
              </div>

              {/* 3. WELCOME FRESHERS & SUBTITLE */}
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-none inline-flex items-center justify-center lg:justify-start gap-2">
                  <span>WELCOME</span>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    FRESHERS
                  </span>
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">
                  to SVCE Robotics Club
                </p>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Build autonomous robots, embedded systems, and intelligent machines. Join our official community and start your engineering journey today.
                </p>
              </div>

              {/* 4. HERO CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <a
                  href="#register-form"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.99]"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Enter the Lucky Draw</span>
                  <ChevronDown className="h-4 w-4" />
                </a>

                <Link
                  href="/about"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-white border border-slate-200 px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
                >
                  <Bot className="h-4 w-4 text-blue-600" />
                  <span>Explore Robotics Club</span>
                </Link>
              </div>
            </div>

            {/* Campaign Highlights Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm text-left">
              <div className="flex items-center space-x-2 text-blue-600">
                <Zap className="h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider">What Awaits You</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Hands-on hardware & microcontroller workshops</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>National robotics competition team selections</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Special welcome kits & membership rewards</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Mentorship from senior robotics engineers</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT / REGISTRATION FORM SECTION */}
          <div className="lg:col-span-6 xl:col-span-5 w-full">
            <section id="register-form" className="scroll-mt-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-200/50">
                <div className="space-y-1.5 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Freshers Campaign</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Enter Lucky Draw</h2>
                  <p className="text-xs text-slate-500">Quick 30-second registration for new SVCE freshers</p>
                </div>

                {errorMessage && (
                  <div className="flex items-start space-x-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Full Name <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-300 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Mobile Number <span className="text-blue-600">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-sm font-semibold text-slate-500">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-xl bg-white border border-slate-300 pl-14 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Stall Rating */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-semibold text-slate-700">
                      How was the Robotics Club stall? <span className="text-blue-600">*</span>
                    </label>
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= (hoverRating || stallRating);
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setStallRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 focus:outline-none transition-transform hover:scale-125"
                          >
                            <Star
                              className={`h-7 w-7 transition-colors ${
                                active ? "text-amber-400 fill-amber-400" : "text-slate-300"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Optional */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Tell us what you liked <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Loved the rover demo & team energy!"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-300 px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none shadow-2xs"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all active:scale-[0.99] mt-2"
                  >
                    {submitting ? (
                      <>
                        <Sparkles className="h-4 w-4 text-white animate-spin" />
                        <span>Submitting Entry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-white" />
                        <span>Submit & Join Lucky Draw</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </section>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
