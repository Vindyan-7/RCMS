import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Robotics Club",
  title: {
    default: "Robotics Club",
    template: "%s | Robotics Club",
  },
  description: "Official Robotics Club portal featuring the public leaderboard, club activities, achievements, and member engagement.",
  keywords: ["Robotics Club", "Autonomous Robotics", "Embedded Systems", "Hardware Engineering", "Student Activity Council"],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Robotics Club",
    description: "Official Robotics Club Portal",
    siteName: "Robotics Club",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Robotics Club",
    description: "Official Robotics Club Portal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
