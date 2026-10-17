export default function PrivacyPromise() {
  const pillars = [
    {
      title: "No storefront",
      desc: "Never walk into a pawn shop. Never be seen. Your entire transaction happens from your phone.",
      icon: "📱",
    },
    {
      title: "No human judgement",
      desc: "AI values your items. No face-to-face haggling. No awkward conversations. No looks.",
      icon: "🤖",
    },
    {
      title: "Discreet logistics",
      desc: "Items move via unbranded Australia Post Parcel Lockers. No PawnPass vehicles. No logos. No telltale packaging.",
      icon: "📦",
    },
    {
      title: "Secure & encrypted",
      desc: "Your data is encrypted end-to-end. ID verification via Stripe. We never sell your information.",
      icon: "🔒",
    },
  ];

  return (
    <section
      id="privacy"
      className="relative overflow-hidden px-6 md:px-12 lg:px-20 xl:px-32 py-16 md:py-20"
      style={{ background: "#0A0A0A", borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      {/* Radial glow — orange privacy shield aura */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(255,107,0,0.08) 0%, transparent 60%)" }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Blueprint header */}
        <div className="flex items-center gap-3 mb-12">
          <span className="font-mono text-[10px] text-gray-300 tracking-widest">FIG.05</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="font-mono text-[10px] text-gray-300 tracking-widest">PRIVACY</span>
        </div>

        {/* Main headline */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
            style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B00" }} />
            <span className="text-[11px] font-medium tracking-wide text-gray-400">THE PAWNPASS PRIVACY PROMISE</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            No judgement.
            <br />
            No storefront.
            <br />
            <span style={{ color: "#FF6B00" }}>No stigma.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto font-light leading-relaxed">
            We built PawnPass because nobody should have to walk into a pawn shop and feel seen.
            Your assets. Your privacy. Your terms.
          </p>
        </div>

        {/* Privacy pillars */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-xl p-6 transition-all duration-300 hover:bg-white/[0.02]"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl shrink-0">{p.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Privacy guarantee banner */}
        <div className="rounded-2xl p-8 md:p-10 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(255,107,0,0.06) 0%, rgba(0,0,0,0.4) 100%)",
            border: "1px solid rgba(255,107,0,0.12)",
          }}>
          <div className="text-5xl mb-4">🛡️</div>
          <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">
            Our guarantee to you
          </h3>
          <p className="text-base text-gray-400 max-w-lg mx-auto font-light leading-relaxed">
            Your identity is verified securely online. Your items are collected from unbranded lockers.
            No one in your community ever needs to know. PawnPass is a financial service — not a store
            you visit. We comply with AUSTRAC and the Privacy Act, but beyond compliance, we promise
            discretion and dignity in every transaction.
          </p>
          <a
            href="/privacy"
            className="inline-flex items-center gap-1 mt-6 text-sm font-medium transition-colors hover:text-white"
            style={{ color: "#FF6B00" }}
          >
            Read our full Privacy Policy →
          </a>
        </div>
      </div>
    </section>
  );
}
