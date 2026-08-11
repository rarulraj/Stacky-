import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClearLegacyStorage } from "@/components/access/ClearLegacyStorage";
import { MemorySync } from "@/components/access/MemorySync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stacky — Industrial Software Architect",
  description:
    "Architect industrial software blueprints — OT platforms, field systems, SCADA, fleet, construction, energy, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <ClearLegacyStorage />
        <MemorySync />
        {children}
      </body>
    </html>
  );
}
