import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Robotics Club",
    template: "%s | Robotics Club",
  },
  description: "Official Robotics Club Portal",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Robotics Club",
    description: "Official Robotics Club Portal",
    siteName: "Robotics Club",
    type: "website",
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
