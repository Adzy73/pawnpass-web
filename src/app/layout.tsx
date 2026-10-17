import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import AIChatWidget from "@/components/AIChatWidget";
import TestModeBanner from "@/components/TestModeBanner";
import StickyPhoneBar from "@/components/StickyPhoneBar";
import catalog from "@/catalog/pawnpass.json";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PawnPass — Pawn Loans & Cash for Your Items, Online",
  description:
    "Get a pawn loan or cash for your items without leaving home. AI-powered valuations, Australia Post Parcel Locker drop-off, instant payment via Osko.",
  metadataBase: new URL("https://pawnpass.com.au"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "PawnPass — Pawn Loans & Cash for Your Items, Online",
    description:
      "Get a pawn loan or cash for your items without leaving home. AI-powered valuations, Australia Post Parcel Locker drop-off, instant payment via Osko.",
    url: "https://pawnpass.com.au",
    siteName: "PawnPass",
    type: "website",
  },
};

const globalSchema = {
  "@context": "https://schema.org",
  "@type": ["FinancialService", "LocalBusiness"],
  name: "PawnPass",
  description: catalog.business.description,
  url: "https://pawnpass.com.au",
  telephone: "+61439726576",
  email: "info@pawnpass.com.au",
  address: {
    "@type": "PostalAddress",
    streetAddress: "311 North East Road",
    addressLocality: "Hampstead Gardens",
    addressRegion: "SA",
    postalCode: "5086",
    addressCountry: "AU",
  },
  areaServed: ["South Australia", "Australia"],
  priceRange: "$$",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    description: "Digital operations 24/7. Hub receiving by appointment.",
  },
  knowsAbout: [
    "Online pawn loans",
    "Digital pawnbroking",
    "Asset-backed lending",
    "Gold and jewellery valuation",
    "Buy outright",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "#0A0A0A" }}>
        <TestModeBanner />
        <AppProvider>
          {children}
          <AIChatWidget />
          <StickyPhoneBar />
        </AppProvider>
      </body>
    </html>
  );
}
