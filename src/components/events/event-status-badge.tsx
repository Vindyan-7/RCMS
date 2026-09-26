"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export function getSubmissionLifecycle(
  startAt: Date | string | null,
  endAt: Date | string | null
): "Not Started" | "Open" | "Closed" {
  const now = new Date();
  if (startAt && now < new Date(startAt)) return "Not Started";
  if (endAt && now > new Date(endAt)) return "Closed";
  return "Open";
}

export function SubmissionStatusBadge({
  startAt,
  endAt,
}: {
  startAt: Date | string | null;
  endAt: Date | string | null;
}) {
  const state = getSubmissionLifecycle(startAt, endAt);
  if (state === "Open") {
    return <Badge variant="success">Submissions Open</Badge>;
  }
  if (state === "Closed") {
    return <Badge variant="secondary">Submissions Closed</Badge>;
  }
  return <Badge variant="outline">Submissions Not Started</Badge>;
}

export function VotingStateBadge({
  state,
}: {
  state: "NOT_STARTED" | "ACTIVE" | "PAUSED" | "CLOSED" | string;
}) {
  switch (state) {
    case "ACTIVE":
      return <Badge variant="success">Voting Active</Badge>;
    case "PAUSED":
      return <Badge variant="warning">Voting Paused</Badge>;
    case "CLOSED":
      return <Badge variant="secondary">Voting Closed</Badge>;
    case "NOT_STARTED":
    default:
      return <Badge variant="outline">Voting Not Started</Badge>;
  }
}

export function WinnerStatusBadge({
  finalized,
}: {
  finalized: boolean;
}) {
  if (finalized) {
    return <Badge variant="success">Winners Finalized</Badge>;
  }
  return <Badge variant="outline">Winners Pending</Badge>;
}

export function SubmissionItemStatusBadge({
  status,
}: {
  status: "draft" | "submitted" | "published" | "rejected" | "hidden" | string;
}) {
  switch (status) {
    case "published":
      return <Badge variant="success">Published</Badge>;
    case "submitted":
      return <Badge variant="info">Submitted (Pending Review)</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "hidden":
      return <Badge variant="secondary">Hidden</Badge>;
    case "draft":
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}
