import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompetitionEventAdminAction } from "@/actions/events/club-events.actions";
import { EventWorkspaceClient } from "@/components/events/event-workspace-client";

export const dynamic = "force-dynamic";

interface EventWorkspacePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: EventWorkspacePageProps): Promise<Metadata> {
  const res = await getCompetitionEventAdminAction(params.id);
  if (!res.success || !res.data) {
    return {
      title: "Event Not Found | RCMS Admin",
    };
  }

  return {
    title: `${res.data.event.name} | RCMS Event Workspace`,
    description:
      res.data.event.description ||
      "Manage competition event, submissions, and voting",
  };
}

export default async function EventWorkspacePage({
  params,
}: EventWorkspacePageProps) {
  const res = await getCompetitionEventAdminAction(params.id);

  if (!res.success || !res.data) {
    notFound();
  }

  const { event, stats, submissions, rankings } = res.data;

  return (
    <EventWorkspaceClient
      initialEvent={event}
      initialStats={stats}
      initialSubmissions={submissions}
      initialRankings={rankings}
    />
  );
}
