export default function RateCard() {
  const tiers = [
    { range: "< $1,000", rate: "35%", gold: "26.25%" },
    { range: "$1k – $3k", rate: "25%", gold: "18.75%", highlight: true },
    { range: "$3k – $5k", rate: "20%", gold: "15%" },
    { range: "$5k+", rate: "Neg.", gold: "Neg." },
  ];

  return (
    <section id="rates" className="px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-28" style={{ background: "#0A0A0A", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-4xl mx-auto">
        {/* Blueprint header */}
        <div className="flex items-center gap-3 mb-12">
          <span className="font-mono text-[10px] text-gray-700 tracking-widest">FIG.03</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="font-mono text-[10px] text-gray-700 tracking-widest">RATE_CARD</span>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            Simple, transparent rates
          </h2>
          <p className="text-lg text-gray-400 max-w-lg mx-auto font-light">
            Monthly interest. No fees. Gold gets 25% off.
          </p>
        </div>

        {/* Rate cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {tiers.map((tier) => (
            <div key={tier.range}
              className="rounded-xl p-6 text-center transition-all hover:scale-[1.02]"
              style={{
                background: tier.highlight ? "rgba(255,107,0,0.04)" : "rgba(255,255,255,0.01)",
                border: tier.highlight ? "1px solid rgba(255,107,0,0.2)" : "1px solid rgba(255,255,255,0.06)",
              }}>
              <p className="font-mono text-xs text-gray-500 mb-3 tracking-wider">{tier.range}</p>
              <p className="text-4xl font-bold mb-1" style={{ color: "#FF6B00" }}>{tier.rate}</p>
              <p className="font-mono text-[10px] text-gray-600 mb-4">PER_MONTH</p>
              <div className="pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="font-mono text-[10px] text-gray-600 mb-1 tracking-wider">GOLD_RATE</p>
                <p className="text-xl font-bold" style={{ color: "#00A87E" }}>{tier.gold}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {["No establishment fees", "No monthly fees", "No credit check", "Cancel anytime", "Insured transit"].map((f) => (
            <div key={f} className="px-4 py-2 rounded-full text-sm text-gray-400"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              ✓ {f}
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="/quote" className="inline-flex rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: "#FF6B00" }}>
            Get your quote →
          </a>
        </div>
      </div>
    </section>
  );
}
