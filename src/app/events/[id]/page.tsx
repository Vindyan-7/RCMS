import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublicCompetitionEventAction,
  getPublishedSubmissionsAction,
} from "@/actions/events/club-events.actions";
import { PublicEventDetailClient } from "@/components/events/public-event-detail-client";

export const dynamic = "force-dynamic";

interface PublicEventPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: PublicEventPageProps): Promise<Metadata> {
  const res = await getPublicCompetitionEventAction(params.id);
  if (!res.success || !res.data) {
    return {
      title: "Event Not Found | Robotics Club",
    };
  }

  return {
    title: `${res.data.name} | Robotics Club`,
    description:
      res.data.description ||
      "Participate in the Robotics Club competition, submit your engineering project, and vote for the best prototypes.",
  };
}

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const [eventRes, subsRes] = await Promise.all([
    getPublicCompetitionEventAction(params.id),
    getPublishedSubmissionsAction(params.id),
  ]);

  if (!eventRes.success || !eventRes.data) {
    notFound();
  }

  const event = eventRes.data;
  const submissions = subsRes.success && subsRes.data ? subsRes.data : [];

  return (
    <PublicEventDetailClient
      event={event}
      initialSubmissions={submissions}
    />
  );
}
