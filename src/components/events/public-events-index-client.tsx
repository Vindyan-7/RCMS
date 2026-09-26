"use client";

import React from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { EventSelect } from "@/db/schema";
import {
  SubmissionStatusBadge,
  VotingStateBadge,
} from "./event-status-badge";
import {
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
} from "lucide-react";

interface PublicEventsIndexClientProps {
  events: EventSelect[];
}

export function PublicEventsIndexClient({ events }: PublicEventsIndexClientProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center space-x-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-semibold text-blue-700">
                <Trophy className="h-3.5 w-3.5 text-blue-600" />
                <span>Technical Competitions & Challenges</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Club Events
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Explore Robotics Club activities, challenges and competitions. Build hardware, showcase your engineering prototypes, and participate in peer voting.
              </p>
            </div>
          </div>
        </section>

        {/* Events Grid Section */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-md mx-auto space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    No club events are available right now.
                  </h3>
                  <p className="text-xs text-slate-500">
                    Check back soon for upcoming workshops, hackathons, and technical competitions.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center space-x-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    <span>Return to Home</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {events.map((event) => {
                  return (
                    <article
                      key={event.id}
                      className="group flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden hover:border-slate-300"
                    >
                      {/* Event Banner */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                        {event.coverImageUrl ? (
                          <img
                            src={event.coverImageUrl}
                            alt={event.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-6">
                            <div className="text-center space-y-2">
                              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-xs">
                                <Trophy className="h-5 w-5 text-amber-400" />
                              </div>
                              <span className="text-xs font-semibold text-slate-300 block tracking-wide uppercase">
                                Robotics Club Challenge
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Top Badges Overlay */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <SubmissionStatusBadge
                            startAt={event.submissionStartAt}
                            endAt={event.submissionEndAt}
                          />
                          {event.points && event.points > 0 ? (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-slate-900/85 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-amber-400 border border-white/10 shadow-xs">
                              <Award className="h-3 w-3" />
                              <span>{event.points} pts</span>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                        <div className="space-y-2.5">
                          <div className="flex items-center space-x-2">
                            <VotingStateBadge state={event.votingState} />
                          </div>

                          <h2 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                            {event.name}
                          </h2>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {event.description || "Join this official technical challenge organized by the Robotics Club."}
                          </p>
                        </div>

                        {/* Details Footer */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>Submissions close:</span>
                            </div>
                            <span className="font-semibold text-slate-700">
                              {formatDate(event.submissionEndAt)}
                            </span>
                          </div>

                          <Link
                            href={`/events/${event.id}`}
                            className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-600 transition-colors"
                          >
                            <span>View Event</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
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
    </div>
  );
}
