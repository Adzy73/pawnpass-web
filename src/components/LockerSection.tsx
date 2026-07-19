export default function LockerSection() {
  return (
    <section id="lockers" className="px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-28"
      style={{ background: "#0A0A0A", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Blueprint header */}
        <div className="flex items-center gap-3 mb-12">
          <span className="font-mono text-[10px] text-gray-700 tracking-widest">FIG.02</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="font-mono text-[10px] text-gray-700 tracking-widest">LOCKER_NETWORK</span>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
              Drop off & pick up
              <br />
              at your local <span style={{ color: "#FF6B00" }}>locker</span>
            </h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed font-light">
              Australia Post Parcel Lockers are 24/7. Scan your digital QR code,
              drop your item, done. When you redeem, we ship it back to a locker near you.
            </p>

            <div className="space-y-3 mb-8">
              {[
                "24/7 — not limited to post office hours",
                "Digital QR code — no printing",
                "Insured transit cover on every shipment",
                "Or book home/office pickup — Uber on-demand",
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,168,126,0.1)" }}>
                    <svg className="w-3 h-3" style={{ color: "#00A87E" }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-base text-gray-400">{text}</p>
                </div>
              ))}
            </div>

            <a href="/shipping" className="inline-flex rounded-full px-7 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ background: "#FF6B00" }}>
              Find a locker →
            </a>
          </div>

          {/* Right — locker visual with blueprint annotations */}
          <div className="relative">
            <div className="rounded-2xl p-8"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              {/* Locker grid */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {Array.from({ length: 9 }).map((_, i) => {
                  const isActive = i === 4;
                  return (
                    <div key={i}
                      className="aspect-square rounded flex items-center justify-center text-[10px] font-mono"
                      style={{
                        background: isActive ? "rgba(255,107,0,0.08)" : "rgba(255,255,255,0.01)",
                        border: isActive ? "1px solid rgba(255,107,0,0.4)" : "1px solid rgba(255,255,255,0.04)",
                        color: isActive ? "#FF6B00" : "rgba(255,255,255,0.08)",
                      }}>
                      {isActive ? "QR" : ""}
                    </div>
                  );
                })}
              </div>

              {/* Blueprint annotations */}
              <div className="space-y-2.5">
                {[
                  ["Nearest locker", "Greenacres Shopping Centre"],
                  ["Distance", "0.3 km"],
                  ["Max size", "35 × 44 × 61 cm"],
                  ["Max weight", "16 kg"],
                  ["Hold window", "48 hours"],
                ].map(([label, value], i) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-gray-600">{label}</span>
                    <span className="text-gray-200 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-3 -right-3 rounded-full px-3 py-1.5"
              style={{ background: "#FF6B00", boxShadow: "0 4px 20px rgba(255,107,0,0.25)" }}>
              <span className="text-[11px] font-bold text-white tracking-wide">24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
