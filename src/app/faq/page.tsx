import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import catalog from "@/catalog/pawnpass.json";

export const metadata: Metadata = {
  title: "FAQ — Pawn Loan Questions Answered | PawnPass",
  description:
    "How do online pawn loans work? What are the rates? How do I get my item back? All your PawnPass questions answered — transparent, no-jargon answers.",
  alternates: { canonical: "https://pawnpass.com.au/faq" },
};

const faqs = catalog.qa_bank.filter((q) => q.publishable && catalog.faq_published.includes(q.id));

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((q) => ({
    "@type": "Question",
    name: q.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: q.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main className="flex-1" style={{ background: "#0A0A0A" }}>
        <div className="px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-32">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6" style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B00" }} />
              <span className="text-[11px] font-medium tracking-wide text-gray-400">FAQ</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Frequently Asked <span style={{ color: "#FF6B00" }}>Questions</span>
            </h1>
            <p className="text-lg text-gray-400 mb-12 leading-relaxed">
              Everything you need to know about pawning or selling your items online with PawnPass.
              No jargon, no fine print — just straight answers.
            </p>

            <div className="space-y-6">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-2xl p-6"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <h2 className="text-lg font-semibold text-white mb-3">{faq.question}</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                  {faq.tags && faq.tags.length > 0 && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {faq.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-1 rounded-full text-gray-500"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-16 text-center rounded-2xl p-8" style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.2)" }}>
              <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
              <p className="text-sm text-gray-400 mb-6">Get an instant quote or reach out to us directly.</p>
              <div className="flex justify-center gap-4">
                <a
                  href="/quote"
                  className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: "#FF6B00" }}
                >
                  Get a quote
                </a>
                <a
                  href="mailto:info@pawnpass.com.au"
                  className="rounded-full px-6 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:text-white"
                  style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
