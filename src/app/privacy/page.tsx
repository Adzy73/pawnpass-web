import Navbar from "@/components/Navbar";

export default function Privacy() {
  return (
    <main className="flex-1" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <div className="relative px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-28">
        {/* Subtle glow */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(255,107,0,0.08) 0%, transparent 60%)" }}
          />
        </div>

        <div className="relative max-w-2xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
              style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.2)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B00" }} />
              <span className="text-[11px] font-medium tracking-wide text-gray-400">PRIVACY POLICY</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white text-center">
            Your privacy is <span style={{ color: "#FF6B00" }}>core</span> to what we do.
          </h1>
          <p className="text-base text-gray-500 max-w-lg mx-auto mb-12 font-light text-center leading-relaxed">
            PawnPass was built to eliminate the stigma of pawnbroking.
            Discretion and dignity aren&apos;t features — they&apos;re the foundation.
          </p>

          {/* Privacy sections */}
          <div className="space-y-8">
            <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-8">
              <h2 className="text-lg font-semibold text-white mb-3">The Privacy Promise</h2>
              <p className="text-sm text-gray-500 leading-relaxed font-light">
                We never have a physical storefront you need to visit. Your items are collected from
                unbranded Australia Post Parcel Lockers — no PawnPass branding, no telltale packaging.
                Your identity is verified online via Stripe Identity. No one in your community needs to
                know you used PawnPass. Beyond legal compliance, we promise discretion and dignity in
                every transaction.
              </p>
            </section>

            <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-8">
              <h2 className="text-lg font-semibold text-white mb-3">Information we collect</h2>
              <p className="text-sm text-gray-500 leading-relaxed font-light">
                PawnPass Pty Ltd (&quot;PawnPass&quot;, &quot;we&quot;, &quot;us&quot;) collects personal information
                including your name, address, date of birth, identification documents (driver&apos;s licence,
                passport), and financial details when you use our services. This is collected securely online
                — never in person.
              </p>
            </section>

            <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-8">
              <h2 className="text-lg font-semibold text-white mb-3">How we use your information</h2>
              <p className="text-sm text-gray-500 leading-relaxed font-light">
                We use your information to verify your identity, process pawn loans, manage shipments,
                comply with AUSTRAC requirements, and provide customer support. We use AI for item
                valuation — no human reviews your items or your situation until physical verification
                at our hub.
              </p>
            </section>

            <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-8">
              <h2 className="text-lg font-semibold text-white mb-3">Information sharing</h2>
              <p className="text-sm text-gray-500 leading-relaxed font-light">
                We share information with Australia Post for shipping, our ID verification provider
                (Stripe) for identity checks, and AUSTRAC as required by law. We do not sell your
                personal information. We do not share your data with third parties for marketing.
              </p>
            </section>

            <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-8">
              <h2 className="text-lg font-semibold text-white mb-3">Data security</h2>
              <p className="text-sm text-gray-500 leading-relaxed font-light">
                We use encryption, secure storage, and access controls to protect your personal
                information. Item photos and identification documents are stored securely. All
                communications are encrypted end-to-end. Access to your data is restricted to
                authorised personnel only.
              </p>
            </section>

            <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-8">
              <h2 className="text-lg font-semibold text-white mb-3">Your rights</h2>
              <p className="text-sm text-gray-500 leading-relaxed font-light">
                You have the right to access, correct, or request deletion of your personal information
                in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles.
                Contact us anytime to exercise these rights.
              </p>
            </section>

            <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-8">
              <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
              <p className="text-sm text-gray-500 leading-relaxed font-light">
                For privacy enquiries:{" "}
                <a href="mailto:info@pawnpass.com.au" className="transition-colors hover:text-white" style={{ color: "#FF6B00" }}>
                  info@pawnpass.com.au
                </a>{" "}
                or 0439 726 576.
              </p>
            </section>
          </div>

          {/* Back link */}
          <div className="text-center mt-16 pt-12" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <a href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
