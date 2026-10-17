import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import catalog from "@/catalog/pawnpass.json";

export const metadata: Metadata = {
  title: "How It Works — Online Pawn Loans | PawnPass",
  description:
    "Snap your item, get an instant AI quote, drop at a Parcel Locker, get paid via Osko. The step-by-step process for pawning or selling items online with PawnPass.",
  alternates: { canonical: "https://pawnpass.com.au/how-it-works" },
};

const pawnService = catalog.services.find((s) => s.id === "pawn-loans")!;

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: `How to get a ${pawnService.name}`,
  description: pawnService.description,
  step: pawnService.process_steps.map((step, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: step,
    text: step,
  })),
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Online Pawn Loans",
  provider: {
    "@type": "FinancialService",
    name: "PawnPass",
    url: "https://pawnpass.com.au",
  },
  areaServed: ["South Australia", "Australia"],
  description: pawnService.description,
  offers: {
    "@type": "Offer",
    priceCurrency: "AUD",
    description: "Rates from 15% to 35% per month depending on loan amount",
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Navbar />
      <main className="flex-1" style={{ background: "#0A0A0A" }}>
        <div className="px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-32">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6" style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B00" }} />
              <span className="text-[11px] font-medium tracking-wide text-gray-400">HOW IT WORKS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Pawn Your Items in <span style={{ color: "#FF6B00" }}>7 Simple Steps</span>
            </h1>
            <p className="text-lg text-gray-400 mb-12 leading-relaxed">
              From photo to payment — the entire process is online. No store visits, no judgement, no paperwork.
            </p>

            {/* Process Steps */}
            <div className="space-y-4 mb-16">
              {pawnService.process_steps.map((step, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 flex gap-6 items-start"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "#FF6B00" }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">{step}</h2>
                  </div>
                  {i === pawnService.process_steps.length - 1 && null}
                </div>
              ))}
            </div>

            {/* What's Included */}
            <div className="rounded-2xl p-8 mb-12" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-semibold text-white mb-4">What&apos;s included</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {pawnService.what_is_included.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-sm flex-shrink-0" style={{ color: "#00A87E" }}>✓</span>
                    <span className="text-sm text-gray-400 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Turnaround */}
            <div className="rounded-2xl p-6 mb-12" style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.2)" }}>
              <div className="flex items-center gap-4">
                <div className="text-3xl">⚡</div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Turnaround time</h3>
                  <p className="text-sm text-gray-400">{pawnService.turnaround}</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/quote"
                className="inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style={{ background: "#FF6B00", boxShadow: "0 0 30px rgba(255,107,0,0.3)" }}
              >
                Get your instant quote →
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
