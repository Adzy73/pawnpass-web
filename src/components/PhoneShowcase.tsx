export default function PhoneShowcase() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20" style={{ background: "#0A0A0A", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,107,0,0.06) 0%, transparent 60%)" }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 md:px-12 lg:px-20 xl:px-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Phone mockup */}
          <div className="flex justify-center md:justify-start">
            <div className="relative" style={{ width: "260px", height: "540px" }}>
              {/* Phone frame */}
              <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] p-2"
                style={{ background: "linear-gradient(145deg, #1a1a1a, #0A0A0A)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 60px rgba(255,107,0,0.15)" }}>
                {/* Screen */}
                <div className="w-full h-full rounded-[2rem] overflow-hidden relative" style={{ background: "#0A0A0A" }}>
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-xl z-10" style={{ background: "#000" }} />

                  {/* Screen content — mini quote flow */}
                  <div className="pt-10 px-3 pb-3 h-full flex flex-col">
                    {/* Status bar */}
                    <div className="flex justify-between items-center px-2 mb-4">
                      <span className="text-[8px] text-gray-400 font-mono">9:41</span>
                      <span className="text-[8px] text-gray-400">●●●</span>
                    </div>

                    {/* Logo */}
                    <div className="flex items-center gap-1.5 mb-4 px-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-white font-bold text-[8px]" style={{ background: "#FF6B00" }}>P</div>
                      <span className="text-[10px] font-bold text-white">Pawn<span style={{ color: "#FF6B00" }}>Pass</span></span>
                    </div>

                    {/* Quote card */}
                    <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[8px] text-gray-500 mb-2">YOUR QUOTE</p>
                      <p className="text-2xl font-bold text-white mb-1">$1,250<span className="text-xs text-gray-400"> loan</span></p>
                      <p className="text-sm font-semibold mb-3" style={{ color: "#FF6B00" }}>$875 buy outright</p>
                      <div className="flex gap-1 mb-2">
                        <div className="px-1.5 py-0.5 rounded-full text-[7px] font-medium" style={{ background: "rgba(0,168,126,0.1)", color: "#00A87E" }}>GOLD RATE 18.75%</div>
                      </div>
                      <div className="h-12 rounded-lg mb-2 flex items-center justify-center"
                        style={{ background: "rgba(255,107,0,0.08)", border: "1px dashed rgba(255,107,0,0.2)" }}>
                        <span className="text-[8px] text-gray-500">📷 Item photos</span>
                      </div>
                    </div>

                    {/* Progress dots */}
                    <div className="flex gap-1 justify-center mb-2">
                      <div className="w-4 h-1 rounded-full" style={{ background: "#FF6B00" }} />
                      <div className="w-4 h-1 rounded-full" style={{ background: "#FF6B00" }} />
                      <div className="w-4 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
                      <div className="w-4 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
                      <div className="w-4 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
                    </div>

                    {/* CTA button */}
                    <div className="rounded-full py-2 text-center text-[9px] font-semibold text-white mt-1" style={{ background: "#FF6B00" }}>
                      Accept quote →
                    </div>

                    {/* Privacy badge */}
                    <div className="mt-auto text-center pt-2">
                      <p className="text-[7px] text-gray-300">🔒 No storefront. No judgement.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <div className="absolute -right-4 top-20 rounded-xl px-3 py-2 hidden md:block"
                style={{ background: "rgba(20,20,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#00A87E" }}>
                    <span className="text-[10px]">✓</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-white">Payment sent</p>
                    <p className="text-[8px] text-gray-500">$1,250 via Osko</p>
                  </div>
                </div>
              </div>

              {/* Floating locker card */}
              <div className="absolute -left-4 bottom-24 rounded-xl px-3 py-2 hidden md:block"
                style={{ background: "rgba(20,20,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
                <div className="flex items-center gap-2">
                  <div className="text-lg">📦</div>
                  <div>
                    <p className="text-[9px] font-semibold text-white">Locker ready</p>
                    <p className="text-[8px] text-gray-500">Greenacres · 0.3km</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Copy */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[10px] text-gray-300 tracking-widest">FIG.00</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="font-mono text-[10px] text-gray-300 tracking-widest">APP_PREVIEW</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 text-white">
              The whole process,
              <br />
              <span style={{ color: "#FF6B00" }}>from your phone.</span>
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed font-light">
              No counters. No queues. No paperwork. Just snap your item, accept your quote,
              and drop it at a parcel locker near you. Payment sent via Osko after inspection.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,0,0.1)" }}>
                  <span className="text-xs">📸</span>
                </div>
                <p className="text-sm text-gray-400">Snap photos, get an instant AI quote</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,0,0.1)" }}>
                  <span className="text-xs">📦</span>
                </div>
                <p className="text-sm text-gray-400">Drop at a 24/7 parcel locker near you</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,0,0.1)" }}>
                  <span className="text-xs">⚡</span>
                </div>
                <p className="text-sm text-gray-400">Paid via Osko after verification</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,0,0.1)" }}>
                  <span className="text-xs">🔒</span>
                </div>
                <p className="text-sm text-gray-400">No one sees you. No one judges you.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
