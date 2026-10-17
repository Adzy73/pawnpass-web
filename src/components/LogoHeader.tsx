"use client";

import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

export default function LogoHeader({
  backLink = "/",
  backLabel = "← Home",
  mode,
}: {
  backLink?: string;
  backLabel?: string;
  mode?: "admin" | "customer";
}) {
  const pathname = usePathname();
  const isAdmin = mode === "admin" || (pathname && pathname.startsWith("/admin"));

  if (isAdmin) {
    return (
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10" style={{ background: "rgba(10,10,10,0.95)" }}>
        <div className="px-4 sm:px-6 py-3 max-w-7xl mx-auto flex flex-col gap-3">
          {/* Top Header Row */}
          <div className="flex items-center justify-between">
            <a href="/admin" className="flex items-center gap-2.5 group">
              <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-9 h-9 transition-transform group-hover:scale-[1.05]" />
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white leading-none">Pawn<span style={{ color: "#FF6B00" }}>Pass</span></span>
                <span className="text-[8px] font-mono tracking-[1.5px] text-[#FF6B00] mt-0.5">ADMIN HUB (STAFF ONLY)</span>
              </div>
            </a>

            <a href="/" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all">
              ← Public Site
            </a>
          </div>

          {/* Admin Navigation Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-white/5 text-xs font-medium">
            <a
              href="/admin"
              className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                pathname === "/admin"
                  ? "bg-[#FF6B00] border-[#FF6B00] text-white font-bold"
                  : "bg-white/[0.05] border-white/10 text-gray-300 hover:text-white"
              }`}
            >
              📊 Main Admin
            </a>
            <a
              href="/admin/inspect"
              className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                pathname === "/admin/inspect"
                  ? "bg-[#FF6B00] border-[#FF6B00] text-white font-bold"
                  : "bg-white/[0.05] border-white/10 text-gray-300 hover:text-white"
              }`}
            >
              🔍 Hub Inspection
            </a>
            <a
              href="/admin/resale"
              className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                pathname === "/admin/resale"
                  ? "bg-[#FF6B00] border-[#FF6B00] text-white font-bold"
                  : "bg-white/[0.05] border-white/10 text-gray-300 hover:text-white"
              }`}
            >
              🛍 Resale Auto-Lister
            </a>
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all whitespace-nowrap ml-auto"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // ── Customer Header ──
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10" style={{ background: "rgba(10,10,10,0.9)" }}>
      <div className="px-4 sm:px-8 flex items-center justify-between h-16 max-w-7xl mx-auto">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2.5 group">
          <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-9 h-9 transition-transform group-hover:scale-[1.05]" />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-none">Pawn<span style={{ color: "#FF6B00" }}>Pass</span></span>
            <span className="text-[8px] font-medium tracking-[1.5px] text-gray-500 mt-0.5">DIGITAL PAWNBROKER</span>
          </div>
        </a>

        {/* Customer Nav Links */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <a href="/dashboard" className="px-3 py-1.5 rounded-full border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-all">
            📊 My Dashboard
          </a>
          <a href="/quote" className="px-3.5 py-1.5 rounded-full text-white font-bold transition-all hover:scale-[1.02]" style={{ background: "#FF6B00" }}>
            ⚡ Get Quote
          </a>
          <button
            onClick={() => logout()}
            className="px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}