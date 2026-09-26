import { Metadata } from "next";
import { getClubEventsAdminAction } from "@/actions/events/club-events.actions";
import { EventsDashboardClient } from "@/components/events/events-dashboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Club Events | RCMS Admin",
  description: "Robotics Club events, competitions, submissions, and voting management",
};

export default async function ClubEventsPage() {
  const res = await getClubEventsAdminAction();
  const events = res.success && res.data ? res.data.events : [];

  return <EventsDashboardClient initialEvents={events} />;
}
