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
  title: "Stacky | Industrial Software Architect",
  description:
    "Architect industrial software blueprints for OT platforms, field systems, SCADA, fleet, construction, energy, and more.",
  applicationName: "Stacky",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
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
