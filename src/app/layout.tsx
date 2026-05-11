import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelForge AI — Autonomous AI Creative Studio",
  description:
    "Create viral short-form video content with AI. ReelForge AI autonomously writes scripts, generates storyboards, produces cinematic videos, and optimizes for virality — all in one pipeline.",
  keywords: [
    "AI video generator",
    "viral content creator",
    "short-form video",
    "Runway AI",
    "content creation",
    "AI creative studio",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
