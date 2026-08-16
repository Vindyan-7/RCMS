import { Metadata } from "next";
import { getActiveCampaignPublicAction } from "@/actions/freshers/freshers_public.actions";
import { FreshersPublicClient } from "@/components/freshers/freshers-public-client";

export const metadata: Metadata = {
  title: "Welcome Freshers | Robotics Club",
  description: "Join the SVCE Robotics Club Freshers Recruitment & Lucky Draw Campaign.",
};

export const dynamic = "force-dynamic";

export default async function FreshersPage() {
  const campaignRes = await getActiveCampaignPublicAction();
  const campaign = campaignRes.data || null;

  return <FreshersPublicClient campaign={campaign} />;
}
