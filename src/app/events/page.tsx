import { Metadata } from "next";
import { getPublicCompetitionEventsListAction } from "@/actions/events/club-events.actions";
import { PublicEventsIndexClient } from "@/components/events/public-events-index-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Club Events | Robotics Club",
  description: "Explore Robotics Club activities, challenges, and engineering competitions.",
};

export default async function PublicEventsPage() {
  const res = await getPublicCompetitionEventsListAction();
  const events = res.success && res.data ? res.data : [];

  return <PublicEventsIndexClient events={events} />;
}
