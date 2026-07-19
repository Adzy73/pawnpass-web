import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PawnPass — Pawn Loans & Cash for Your Items, Online",
  description: "Get a pawn loan or cash for your items without leaving home. AI-powered valuations, Australia Post Parcel Locker drop-off, instant payment via Osko.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: "#0A0A0A" }}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
