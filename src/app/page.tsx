"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/launch-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <main className="flex-1 relative overflow-hidden" style={{ background: "#0A0A0A" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(255,107,0,0.12) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 70%)" }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
        backgroundSize: "50px 50px",
      }} />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-12 h-12" />
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-white leading-none">Pawn<span style={{ color: "#FF6B00" }}>Pass</span></span>
            <span className="text-[9px] font-medium tracking-[2px] text-gray-600 mt-1">DIGITAL PAWNBROKER</span>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8" style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.25)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF6B00" }}></span>
          <span className="text-[11px] font-medium tracking-wide text-gray-400">COMING SOON</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-5 text-white text-center max-w-3xl">
          Australia's first<br />
          <span style={{ color: "#FF6B00" }}>digital pawnbroker.</span>
        </h1>

        <p className="text-base md:text-lg text-gray-400 max-w-xl text-center mb-10 leading-relaxed font-light">
          Pawn your items without ever stepping into a store. No judgement. No storefront. No stigma.
          Snap, quote, drop at a locker. Cash in minutes.
        </p>

        {/* Signup form */}
        {status === "success" ? (
          <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "rgba(0,168,126,0.06)", border: "1px solid rgba(0,168,126,0.2)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#00A87E" }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You're on the list!</h2>
            <p className="text-sm text-gray-400">{message}</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm text-gray-500 hover:text-white transition-colors"
            >
              ← Add another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
            />
            <button
              type="submit"
              disabled={status === "loading" || !email}
              className="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] disabled:opacity-40"
              style={{ background: "#FF6B00", boxShadow: "0 0 30px rgba(255,107,0,0.3)" }}
            >
              {status === "loading" ? "Joining…" : "Notify me when it's live →"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-400 text-center">{message}</p>
            )}
          </form>
        )}

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl">
          <div className="text-center">
            <div className="text-3xl mb-2">📸</div>
            <p className="text-xs text-gray-500">AI-powered instant quotes</p>
          </div>
          <div className="text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-3xl mb-2">📦</div>
            <p className="text-xs text-gray-500">24/7 parcel locker drop-off</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-xs text-gray-500">Osko instant payment</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs text-gray-700">
            © 2026 Pawn Pass · ACL: Theorify · AUSTRAC registered
          </p>
          <div className="flex gap-4 justify-center mt-3">
            <a href="/privacy" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy</a>
            <a href="/terms" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Terms</a>
            <a href="mailto:info@pawnpass.com.au" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </main>
  );
}
