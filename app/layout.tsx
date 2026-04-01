/**
 * NETRA AI — Root Layout
 * 
 * Provides the HTML shell with proper metadata and font imports.
 * Uses Inter font for the intelligence dashboard aesthetic.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NETRA AI — Global Intelligence Ontology Engine",
  description:
    "AI-powered geopolitical intelligence platform analyzing global events with India-centric impact assessment, knowledge graphs, and scenario simulation.",
  keywords: [
    "geopolitical intelligence",
    "AI analysis",
    "India security",
    "knowledge graph",
    "scenario simulation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
