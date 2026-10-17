import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import catalog from "@/catalog/pawnpass.json";

export const metadata: Metadata = {
  title: "What Items Can I Pawn? | PawnPass",
  description:
    "Gold and jewellery, watches, phones, laptops, tablets, gaming consoles, tools, cameras. See all accepted item categories and how much you can borrow against each.",
  alternates: { canonical: "https://pawnpass.com.au/items" },
};

const categories = catalog.accepted_item_categories;
const conditions = catalog.condition_grades;

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Online Pawn Loans & Buy Outright",
  provider: { "@type": "FinancialService", name: "PawnPass", url: "https://pawnpass.com.au" },
  areaServed: ["South Australia", "Australia"],
  description: "Pawn or sell items online. Accepted categories: gold, watches, phones, laptops, tablets, gaming, tools, cameras.",
};

export default function ItemsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Navbar />
      <main className="flex-1" style={{ background: "#0A0A0A" }}>
        <div className="px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-32">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6" style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B00" }} />
              <span className="text-[11px] font-medium tracking-wide text-gray-400">ACCEPTED ITEMS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              What Can I <span style={{ color: "#FF6B00" }}>Pawn or Sell?</span>
            </h1>
            <p className="text-lg text-gray-400 mb-12 leading-relaxed">
              We accept a wide range of personal items that are shippable via Australia Post (under 16kg, within 35×44×61cm).
              Here&apos;s what we take and how much you can typically borrow against each category.
            </p>

            {/* Category Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-16">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl p-6"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <h3 className="text-sm font-semibold text-white mb-2">{cat.label}</h3>
                  <div className="text-xs text-gray-500 mb-1">
                    Loan: up to {Math.round(cat.loan_ltv * 100)}% of value
                  </div>
                  <div className="text-xs text-gray-500">
                    Buy: up to {Math.round(cat.buy_ltv * 100)}% of value
                  </div>
                  {cat.notes && (
                    <p className="text-[10px] text-gray-400 mt-2">{cat.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Condition Grades */}
            <div className="rounded-2xl p-8 mb-12" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-semibold text-white mb-4">Condition Grades</h3>
              <p className="text-sm text-gray-400 mb-6">Your item&apos;s condition affects its valuation. Here&apos;s how we grade:</p>
              <div className="grid md:grid-cols-5 gap-3">
                {conditions.map((cond) => (
                  <div key={cond.id} className="text-center rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="text-lg font-bold text-white mb-1">{Math.round(cond.multiplier * 100)}%</div>
                    <div className="text-xs text-gray-500">{cond.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Limits */}
            <div className="rounded-2xl p-6 mb-12" style={{ background: "rgba(0,168,126,0.06)", border: "1px solid rgba(0,168,126,0.2)" }}>
              <h3 className="text-sm font-semibold text-white mb-3">📦 Shipping limits</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Items must fit within Australia Post Parcel Locker dimensions (35×44×61cm max) and weigh under 16kg.
                Bulky items like furniture and vehicles are not accepted at launch.
              </p>
            </div>

            <div className="text-center">
              <a
                href="/quote"
                className="inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style={{ background: "#FF6B00", boxShadow: "0 0 30px rgba(255,107,0,0.3)" }}
              >
                Get a quote for your item →
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
