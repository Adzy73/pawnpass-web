export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10" style={{ background: "rgba(10,10,10,0.9)" }}>
      <div className="px-4 sm:px-8 flex items-center justify-between h-16 max-w-7xl mx-auto">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-9 h-9 transition-transform group-hover:scale-[1.05]" />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-none">Pawn<span style={{ color: "#FF6B00" }}>Pass</span></span>
            <span className="text-[8px] font-medium tracking-[1.5px] text-gray-500 mt-0.5">DIGITAL PAWNBROKER</span>
          </div>
        </a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/how-it-works" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">How it works</a>
          <a href="/items" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Items</a>
          <a href="/pricing" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Rates</a>
          <a href="/faq" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">FAQ</a>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2.5">
          <a
            href="/login"
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-500/30 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
          >
            Sign In / Admin
          </a>
          <a href="/quote" className="rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: "#FF6B00" }}>
            Get a quote
          </a>
        </div>
      </div>
    </nav>
  );
}