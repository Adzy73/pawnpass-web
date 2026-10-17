import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import catalog from "@/catalog/pawnpass.json";

export const metadata: Metadata = {
  title: "Pawn Loan Rates & Pricing | PawnPass",
  description:
    "Transparent pawn loan rates: under $1k = 35%/month, $1k-$3k = 25%/month, $3k-$5k = 20%/month. Gold gets 25% off. No establishment fees, no monthly fees, no credit checks.",
  alternates: { canonical: "https://pawnpass.com.au/pricing" },
};

const pricing = catalog.pricing;
const rates = pricing.loan_rates;

const businessSchema = {
  "@context": "https://schema.org",
  "@type": "FinancialService",
  name: "PawnPass",
  description: catalog.business.description,
  url: "https://pawnpass.com.au",
  areaServed: ["South Australia", "Australia"],
  priceRange: "$$",
};

const offerSchema = rates.tiers.map((tier) => ({
  "@context": "https://schema.org",
  "@type": "Offer",
  name: `Pawn Loan — ${tier.loan_amount_range}`,
  description: `Standard rate: ${tier.standard_rate}. Gold rate: ${tier.gold_rate}.`,
  priceCurrency: "AUD",
  seller: { "@type": "FinancialService", name: "PawnPass" },
}));

export default function PricingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }} />
      <Navbar />
      <main className="flex-1" style={{ background: "#0A0A0A" }}>
        <div className="px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-32">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6" style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B00" }} />
              <span className="text-[11px] font-medium tracking-wide text-gray-400">PRICING</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Transparent <span style={{ color: "#FF6B00" }}>Rates</span>. No Hidden Fees.
            </h1>
            <p className="text-lg text-gray-400 mb-12 leading-relaxed">
              Our pawn loan rates are charged <strong className="text-white">per month</strong> (industry standard for pawn loans).
              The rate depends on your loan amount — the more you borrow, the lower the rate. Gold and gold jewellery get a 25% discount.
            </p>

            {/* Rate Table */}
            <div className="rounded-2xl overflow-hidden mb-12" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(255,107,0,0.08)" }}>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white">Loan Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white">Standard Rate</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white">Gold Rate (25% off)</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.tiers.map((tier, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td className="px-6 py-4 text-sm text-gray-300">{tier.loan_amount_range}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-white">{tier.standard_rate}</td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#FF6B00" }}>{tier.gold_rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Fees */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-sm font-semibold text-white mb-4">What you DON'T pay</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li>✅ No establishment fees</li>
                  <li>✅ No monthly account fees</li>
                  <li>✅ No credit check fees</li>
                  <li>✅ No exit fees</li>
                  <li>✅ No balloon payments</li>
                  <li>✅ Free inbound shipping (to PawnPass)</li>
                </ul>
              </div>
              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-sm font-semibold text-white mb-4">What drives your rate</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li>📉 Rate decreases as loan amount increases</li>
                  <li>📉 Gold & gold jewellery get 25% off</li>
                  <li>📈 Poor condition reduces your loan amount</li>
                  <li>📈 Higher resale value = higher loan amount</li>
                </ul>
              </div>
            </div>

            {/* How LTV works */}
            <div className="rounded-2xl p-8 mb-12" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-semibold text-white mb-4">How your loan amount is calculated</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Your loan amount is a percentage of your item&apos;s estimated resale value (determined by our AI valuation engine).
                The percentage depends on the item category:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {catalog.accepted_item_categories.map((cat) => (
                  <div key={cat.id} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-sm font-medium text-white">{cat.label}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Loan: {Math.round(cat.loan_ltv * 100)}% · Buy: {Math.round(cat.buy_ltv * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparency note */}
            <div className="rounded-2xl p-6 mb-12" style={{ background: "rgba(0,168,126,0.06)", border: "1px solid rgba(0,168,126,0.2)" }}>
              <p className="text-sm text-gray-300 leading-relaxed">
                <strong className="text-white">Transparency guarantee:</strong> {pricing.transparency_note}
              </p>
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
