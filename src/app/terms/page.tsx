export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-6 md:px-12 lg:px-20 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "#FF6B00" }}>P</div>
            <span className="text-xl font-bold tracking-tight">PawnPass</span>
          </a>
          <a href="/" className="text-sm font-medium text-gray-600 hover:text-black">← Home</a>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-sm text-gray-600 space-y-4">
          <p>By using PawnPass, you agree to these terms. PawnPass Pty Ltd operates under Australian Credit Licence &quot;Theorify&quot; and is AUSTRAC registered.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Pawn loans</h2>
          <p>Pawn loans are secured against physical collateral. Interest is charged monthly. If you do not redeem your item within the loan term plus grace period, the item becomes PawnPass property.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Interest rates</h2>
          <p>Current rates: Under $1,000: 35%/month. $1,000-$3,000: 25%/month. $3,000-$5,000: 20%/month. Over $5,000: negotiable. Gold and gold jewellery receive a 25% discount on all tiers.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Shipping</h2>
          <p>Items are shipped via Australia Post with transit cover. Parcel Locker drop-off is available 24/7. Home pickup is available as a premium service.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Payment</h2>
          <p>Loan funds are disbursed via Osko instant bank transfer after physical verification at our hub. Funds are not released upon shipment — only after item verification.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Contact</h2>
          <p>For questions: info@pawnpass.com.au or 0439 726 576. PawnPass Hub: 311 NE Road, Hampstead Gardens SA.</p>
        </div>
      </div>
    </div>
  );
}
