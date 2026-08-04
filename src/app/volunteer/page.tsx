import type { Metadata } from "next";
import { VolunteerPortalClient } from "@/components/attendance/volunteer-portal-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Volunteer Portal",
};

export default function VolunteerPortalPage() {
  return <VolunteerPortalClient />;
}
