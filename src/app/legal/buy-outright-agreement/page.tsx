import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BuyOutrightAgreement() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold text-white">Buy Outright Agreement</h1>
            <p className="text-xs text-gray-500">Under the Second-hand Dealers and Pawnbrokers Act 1996 (SA)</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <div className="rounded-lg p-4 border border-[#FF6B00]/20" style={{ background: "rgba(255,107,0,0.05)" }}>
            <p className="text-xs text-gray-400">This is a provisional agreement template. Final terms are generated per transaction. This document must be reviewed by a legal practitioner before use.</p>
          </div>

          <h2 className="text-lg font-semibold text-white mt-8">1. Parties</h2>
          <p><strong className="text-white">Buyer:</strong> PawnPass Pty Ltd (ABN: TBC), 311 North East Road, Hampstead Gardens SA 5086. Registered under the Second-hand Dealers and Pawnbrokers Act 1996 (SA).</p>
          <p><strong className="text-white">Seller:</strong> [Customer full name], [Residential address], [Date of birth]. Identity verified in accordance with Regulation 9 of the Second-hand Dealers and Pawnbrokers Regulations 2013 (SA).</p>

          <h2 className="text-lg font-semibold text-white mt-8">2. Item Description</h2>
          <table className="w-full text-sm border border-white/10">
            <tbody>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Item description</td><td className="p-3 text-white">[ITEM_DESCRIPTION]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Brand</td><td className="p-3 text-white">[BRAND]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Model</td><td className="p-3 text-white">[MODEL]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Serial number</td><td className="p-3 text-white">[SERIAL_NUMBER]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Colour</td><td className="p-3 text-white">[COLOUR]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Distinguishing features</td><td className="p-3 text-white">[DISTINGUISHING_FEATURES]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Unique identification code</td><td className="p-3 text-white font-mono">[ID_CODE]</td></tr>
              <tr><td className="p-3 text-gray-400">Condition</td><td className="p-3 text-white">[CONDITION]</td></tr>
            </tbody>
          </table>

          <h2 className="text-lg font-semibold text-white mt-8">3. Purchase Price</h2>
          <table className="w-full text-sm border border-white/10">
            <tbody>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Purchase price</td><td className="p-3 text-white font-medium">$[PURCHASE_PRICE]</td></tr>
              <tr><td className="p-3 text-gray-400">Payment method</td><td className="p-3 text-white">Osko bank transfer (within 1 business day of inspection)</td></tr>
            </tbody>
          </table>

          <h2 className="text-lg font-semibold text-white mt-8">4. Title Transfer</h2>
          <p>Title to the goods transfers from the Seller to PawnPass upon payment of the purchase price. Upon title transfer:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The goods become the property of PawnPass</li>
            <li>The Seller has no right of redemption</li>
            <li>The Seller has no further claim to the goods</li>
            <li>PawnPass may sell, dispose of, or otherwise deal with the goods as it sees fit</li>
          </ul>

          <h2 className="text-lg font-semibold text-white mt-8">5. No Warranty</h2>
          <p>The goods are sold "as is" to PawnPass. PawnPass acknowledges that it has had the opportunity to inspect the goods (via photos and physical inspection at the hub) and accepts the goods in their current condition. The Seller warrants that the goods are accurately described and are not stolen.</p>

          <h2 className="text-lg font-semibold text-white mt-8">6. Seller Representations</h2>
          <p>The Seller represents that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The Seller is the legal owner of the goods and has the right to sell them</li>
            <li>The goods are not stolen goods</li>
            <li>The goods are not subject to any security interest, lien, or encumbrance</li>
            <li>The Seller is 18 years of age or older</li>
            <li>The information provided to PawnPass is true and accurate</li>
          </ul>

          <h2 className="text-lg font-semibold text-white mt-8">7. Provisional Quote</h2>
          <p>The purchase price quoted is a provisional offer subject to physical inspection at the PawnPass hub. If the item's condition or model differs from the description provided, PawnPass may issue a revised offer. The Seller may accept the revised offer or decline and have the item returned at no cost.</p>

          <h2 className="text-lg font-semibold text-white mt-8">8. Retention Period</h2>
          <p>Prescribed goods (excluding jewellery, watches, and precious metals) will be held by PawnPass for a minimum of 10 days before resale, in accordance with section 10 of the Second-hand Dealers and Pawnbrokers Act 1996 (SA). Jewellery, watches, and precious metals are exempt from this requirement under regulation 4(3).</p>

          <h2 className="text-lg font-semibold text-white mt-8">9. Privacy and Records</h2>
          <p>PawnPass maintains records of this transaction as required by the Second-hand Dealers and Pawnbrokers Act 1996 (SA). Records are retained for 5 years. Transaction details may be provided to South Australia Police upon request.</p>

          <h2 className="text-lg font-semibold text-white mt-8">10. Governing Law</h2>
          <p>This agreement is governed by the laws of South Australia. Any term inconsistent with the Second-hand Dealers and Pawnbrokers Act 1996 (SA) is void to the extent of the inconsistency.</p>

          <h2 className="text-lg font-semibold text-white mt-8">11. Contact</h2>
          <p>PawnPass Pty Ltd<br />311 North East Road, Hampstead Gardens SA 5086<br />info@pawnpass.com.au · 0439 726 576</p>

          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-gray-500 mb-2">SELLER SIGNATURE</p>
                <div className="h-16 border-b border-white/20"></div>
                <p className="text-xs text-gray-500 mt-2">[CUSTOMER_NAME]</p>
                <p className="text-xs text-gray-500">Date: [DATE]</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">BUYER</p>
                <div className="h-16 flex items-end">
                  <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-8 h-8 mb-2" />
                </div>
                <div className="h-16 -mt-14 border-b border-white/20"></div>
                <p className="text-xs text-gray-500 mt-2">PawnPass Pty Ltd</p>
                <p className="text-xs text-gray-500">Date: [DATE]</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-gray-500">
              <strong>Transaction ID:</strong> [TRANSACTION_ID] · <strong>Date:</strong> [DATE] · <strong>Unique Code:</strong> [ID_CODE]
            </p>
            <p className="text-xs text-gray-400 mt-2">
              This record is kept in accordance with section 8 of the Second-hand Dealers and Pawnbrokers Act 1996 (SA) and will be retained for 5 years.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}