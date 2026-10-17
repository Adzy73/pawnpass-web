export default function Footer() {
  return (
    <footer style={{ background: "#0A0A0A" }} className="text-white">
      <div className="px-6 md:px-12 lg:px-20 xl:px-32 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <a href="/" className="flex items-center gap-2.5 mb-4">
              <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-10 h-10" />
              <span className="text-lg font-bold tracking-tight text-white">Pawn<span style={{ color: "#FF6B00" }}>Pass</span></span>
            </a>
            <p className="text-sm text-gray-400 leading-relaxed">
              Australia&apos;s first fully digital pawnbroker. Pawn loans and cash for your items — without leaving home.
            </p>
          </div>

          {/* Links columns */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Get started</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/quote" className="hover:text-white transition-colors">Get a quote</a></li>
              <li><a href="/how-it-works" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="/pricing" className="hover:text-white transition-colors">Rates</a></li>
              <li><a href="/items" className="hover:text-white transition-colors">Accepted items</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Sign in</a></li>
              <li><a href="/admin" className="hover:text-white transition-colors" style={{ color: "#FF6B00" }}>Admin Dashboard</a></li>
              <li><a href="mailto:info@pawnpass.com.au" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="mailto:info@pawnpass.com.au" className="hover:text-white transition-colors">info@pawnpass.com.au</a></li>
              <li>311 NE Road, Hampstead Gardens SA</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-6">
              <span>© 2026 Pawn Pass. All rights reserved.</span>
              <span>ACL: Theorify</span>
              <span>AUSTRAC registered</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
