import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RCMS — Robotics Club Management System",
  description: "Internal management platform for SAC Robotics Club",
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
