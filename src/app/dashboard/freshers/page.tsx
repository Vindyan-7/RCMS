import { Metadata } from "next";
import { getFreshersAdminDashboardAction } from "@/actions/freshers/freshers_admin.actions";
import { FreshersAdminClient } from "@/components/freshers/freshers-admin-client";

export const metadata: Metadata = {
  title: "Freshers Campaign | RCMS Admin",
  description: "Manage fresher registrations, campaign status, and lucky draw selections.",
};

export const dynamic = "force-dynamic";

export default async function FreshersAdminPage() {
  const dashboardRes = await getFreshersAdminDashboardAction();
  const initialData = dashboardRes.data || {
    activeCampaign: null,
    stats: { totalEntries: 0, todaysEntries: 0, avgRating: 0, eligibleEntries: 0, winnersSelected: 0 },
    entries: [],
    total: 0,
    winners: [],
  };

  return <FreshersAdminClient initialData={initialData} />;
}
