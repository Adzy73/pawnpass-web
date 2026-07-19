export default function TrustSection() {
  const features = [
    { title: "No storefront, ever", desc: "Your entire transaction happens from your phone. No walking into a shop. No being seen. No stigma.", icon: "📱" },
    { title: "AI valuation", desc: "Analyses your photos against thousands of market sales. Fair, instant, no haggling, no human judgement.", icon: "🤖" },
    { title: "Discreet collection", desc: "Items move via unbranded Australia Post Parcel Lockers. No PawnPass vehicles. No logos. No telltale packaging.", icon: "📦" },
    { title: "Banking-grade security", desc: "Your data is encrypted end-to-end. ID verified via Stripe. We never sell your information.", icon: "🔒" },
    { title: "Osko in minutes", desc: "Verified at our hub, money sent to your bank instantly. No waiting days for a transfer.", icon: "⚡" },
    { title: "No credit check", desc: "Secured against your item, not your credit file. Walk away anytime, no default.", icon: "✅" },
  ];

  return (
    <section id="trust" className="px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-28" style={{ background: "#0A0A0A", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Blueprint header */}
        <div className="flex items-center gap-3 mb-12">
          <span className="font-mono text-[10px] text-gray-700 tracking-widest">FIG.04</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="font-mono text-[10px] text-gray-700 tracking-widest">FEATURES</span>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            Pawnbroking, evolved
          </h2>
          <p className="text-lg text-gray-400 max-w-lg mx-auto font-light">
            Everything that works about pawnbroking. Nothing that doesn't.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title}
              className="rounded-xl p-6 transition-all duration-300 hover:bg-white/[0.02]"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 pt-12 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <h3 className="text-xl font-semibold text-white mb-2">Ready to start?</h3>
          <p className="text-base text-gray-400 mb-6 font-light">Free quote in 2 minutes. No obligation.</p>
          <a href="/quote" className="inline-flex rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: "#FF6B00" }}>
            Get a free quote →
          </a>
        </div>
      </div>
    </section>
  );
}
