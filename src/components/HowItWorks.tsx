export default function HowItWorks() {
  const steps = [
    { num: "01", title: "Snap & quote", desc: "Take a photo. AI gives you a loan amount and buy price instantly.", icon: "📸" },
    { num: "02", title: "Verify ID", desc: "Driver's licence or passport. Two minutes, fully encrypted.", icon: "🪪" },
    { num: "03", title: "Drop at locker", desc: "Digital QR code to any Parcel Locker. Or book a home pickup.", icon: "📦" },
    { num: "04", title: "Get paid", desc: "We verify at our hub, then Osko payment to your bank.", icon: "⚡" },
    { num: "05", title: "Redeem or relax", desc: "Pay back online, item ships back. Or walk away — no credit impact.", icon: "🔓" },
  ];

  return (
    <section id="how" className="px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-28" style={{ background: "#0A0A0A" }}>
      {/* Blueprint header line */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-[10px] text-gray-300 tracking-widest">FIG.01</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="font-mono text-[10px] text-gray-300 tracking-widest">PROCESS</span>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            Photo to payment in 5 steps
          </h2>
          <p className="text-lg text-gray-400 max-w-lg mx-auto font-light">
            No store visits. No paperwork. No waiting.
          </p>
        </div>

        {/* Steps with blueprint connector lines */}
        <div className="relative">
          {/* Horizontal line on desktop */}
          <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-px" style={{ background: "rgba(255,255,255,0.04)" }} />

          <div className="grid md:grid-cols-5 gap-6 md:gap-2">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Node dot on the line */}
                <div className="hidden md:flex justify-center mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ background: i === 0 ? "#FF6B00" : "rgba(255,255,255,0.1)", boxShadow: i === 0 ? "0 0 12px rgba(255,107,0,0.4)" : "none" }} />
                </div>

                {/* Card */}
                <div className="rounded-xl p-5 transition-all duration-300 hover:bg-white/[0.03]"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="font-mono text-sm font-bold" style={{ color: "#FF6B00" }}>{step.num}</span>
                    <div className="text-3xl">{step.icon}</div>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>

                {/* Arrow */}
                {i < 4 && (
                  <div className="hidden md:flex justify-center mt-3">
                    <svg className="w-4 h-4 opacity-20" style={{ color: "#666" }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
