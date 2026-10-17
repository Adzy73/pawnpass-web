export default function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#0A0A0A" }}>
      {/* Layered radial glows — warmer, more visible */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(255,107,0,0.15) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,107,0,0.06) 0%, transparent 70%)" }} />
      </div>

      {/* Faint grid — more visible */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

      {/* Blueprint corner marks */}
      <div className="absolute top-6 left-6 opacity-30 font-mono text-[10px] text-gray-500 hidden md:block pointer-events-none">
        PP-001 // SYSTEM
      </div>
      <div className="absolute top-6 right-6 opacity-30 font-mono text-[10px] text-gray-500 hidden md:block pointer-events-none">
        v0.1.0
      </div>

      <div className="relative px-6 md:px-12 lg:px-20 xl:px-32 pt-16 pb-16 md:pt-20 md:pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
              style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF6B00" }} />
              <span className="text-[11px] font-medium tracking-wide text-gray-400">AUSTRALIA&apos;S FIRST DIGITAL PAWNBROKER</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.05] mb-5 text-white text-center">
            Your assets.
            <br />
            Your <span style={{ color: "#FF6B00" }}>privacy.</span>
            <br />
            Your terms.
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed text-center font-light">
            Pawn your items without ever stepping into a store.
            No judgement. No storefront. No stigma.
            Snap, quote, drop at a locker. Cash after verification.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <a href="/quote"
              className="rounded-full px-8 py-3.5 text-sm font-semibold text-white flex items-center justify-center transition-all hover:scale-[1.02]"
              style={{ background: "#FF6B00", boxShadow: "0 0 30px rgba(255,107,0,0.3)" }}>
              Get a free quote →
            </a>
            <a href="#how"
              className="rounded-full px-8 py-3.5 text-sm font-semibold text-gray-400 flex items-center justify-center transition-all hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              See how it works
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">2<span className="text-lg text-gray-400">min</span></p>
              <p className="font-mono text-[10px] text-gray-400 tracking-widest">TO_QUOTE</p>
            </div>
            <div className="text-center border-x" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">24/7</p>
              <p className="font-mono text-[10px] text-gray-400 tracking-widest">LOCKER_ACCESS</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "#FF6B00" }}>Instant</p>
              <p className="font-mono text-[10px] text-gray-400 tracking-widest">OSKO_PAYMENT</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
