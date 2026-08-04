import type { Metadata } from "next";
import { VolunteerPortalClient } from "@/components/attendance/volunteer-portal-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Volunteer Portal",
  description: "Official Robotics Club Volunteer Scanner Portal.",
  openGraph: {
    title: "Volunteer Portal | Robotics Club",
    description: "Official Robotics Club Volunteer Scanner Portal.",
    siteName: "Robotics Club",
  },
  twitter: {
    card: "summary_large_image",
    title: "Volunteer Portal | Robotics Club",
    description: "Official Robotics Club Volunteer Scanner Portal.",
  },
};

export default function VolunteerPortalPage() {
  return <VolunteerPortalClient />;
}
