export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg" style={{ background: "rgba(10,10,10,0.8)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-6 md:px-12 lg:px-20 xl:px-32 flex items-center justify-between h-20">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-12 h-12 transition-transform group-hover:scale-[1.05]" />
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-white leading-none">Pawn<span style={{ color: "#FF6B00" }}>Pass</span></span>
            <span className="text-[9px] font-medium tracking-[2px] text-gray-500 mt-1">DIGITAL PAWNBROKER</span>
          </div>
        </a>

        {/* Nav links - desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">How it works</a>
          <a href="#privacy" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Privacy</a>
          <a href="#rates" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Rates</a>
          <a href="#trust" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Why us</a>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <a href="/login" className="hidden md:inline text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Sign in
          </a>
          <a href="/quote" className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: "#FF6B00" }}>
            Get a quote
          </a>
        </div>
      </div>
    </nav>
  );
}
