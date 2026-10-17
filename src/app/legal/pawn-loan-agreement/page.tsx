import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PawnLoanAgreement() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold text-white">Pawn Loan Agreement</h1>
            <p className="text-xs text-gray-500">Under the Second-hand Dealers and Pawnbrokers Act 1996 (SA)</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <div className="rounded-lg p-4 border border-[#FF6B00]/20" style={{ background: "rgba(255,107,0,0.05)" }}>
            <p className="text-xs text-gray-400">This is a provisional agreement template. Final terms are generated per transaction with specific loan details. This document must be reviewed by a legal practitioner before use.</p>
          </div>

          <h2 className="text-lg font-semibold text-white mt-8">1. Parties</h2>
          <p><strong className="text-white">Pawnbroker:</strong> PawnPass Pty Ltd (ABN: TBC), 311 North East Road, Hampstead Gardens SA 5086. Registered under the Second-hand Dealers and Pawnbrokers Act 1996 (SA). Australian Credit Licence: Theorify. AUSTRAC registered.</p>
          <p><strong className="text-white">Pledgor:</strong> [Customer full name], [Residential address], [Date of birth]. Identity verified in accordance with the Second-hand Dealers and Pawnbrokers Regulations 2013 (SA) Regulation 9.</p>

          <h2 className="text-lg font-semibold text-white mt-8">2. Loan Details</h2>
          <table className="w-full text-sm border border-white/10">
            <tbody>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Loan amount (principal)</td><td className="p-3 text-white font-medium">$[PRINCIPAL]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Monthly interest rate</td><td className="p-3 text-white font-medium">[RATE]% per month</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Monthly interest amount</td><td className="p-3 text-white font-medium">$[MONTHLY_INTEREST]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Redemption period end date</td><td className="p-3 text-white font-medium">[DUE_DATE]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Redemption amount (3 months)</td><td className="p-3 text-white font-medium">$[REDEMPTION_AMOUNT]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Establishment fee</td><td className="p-3 text-white font-medium">$0.00</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Monthly fee</td><td className="p-3 text-white font-medium">$0.00</td></tr>
              <tr><td className="p-3 text-gray-400">Late/dishonour fee</td><td className="p-3 text-white font-medium">$0.00</td></tr>
            </tbody>
          </table>

          <h2 className="text-lg font-semibold text-white mt-8">3. Collateral Description</h2>
          <p>The loan is secured against the following goods (the "Collateral"):</p>
          <table className="w-full text-sm border border-white/10">
            <tbody>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Item description</td><td className="p-3 text-white">[ITEM_DESCRIPTION]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Brand</td><td className="p-3 text-white">[BRAND]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Model</td><td className="p-3 text-white">[MODEL]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Serial number</td><td className="p-3 text-white">[SERIAL_NUMBER]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Colour</td><td className="p-3 text-white">[COLOUR]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Distinguishing features</td><td className="p-3 text-white">[DISTINGUISHING_FEATURES]</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Unique identification code</td><td className="p-3 text-white font-mono">[ID_CODE]</td></tr>
              <tr><td className="p-3 text-gray-400">Goods kept at</td><td className="p-3 text-white">311 North East Road, Hampstead Gardens SA 5086</td></tr>
            </tbody>
          </table>
          {false && <p className="text-xs text-gray-500 mt-2">If this ticket covers more than one item, the items [may / may not] be separately redeemed.</p>}

          <h2 className="text-lg font-semibold text-white mt-8">4. Redemption</h2>
          <p>The redemption period is 90 days from the date of this agreement (the "Redemption Period"). You may redeem the Collateral at any time during the Redemption Period by paying the principal plus accrued interest.</p>
          <p>The Redemption Period may be extended by agreement between PawnPass and you. To extend, you must pay the accrued monthly interest. The procedures for extension are: pay the current month's interest via the PawnPass dashboard or by contacting info@pawnpass.com.au.</p>

          <h2 className="text-lg font-semibold text-white mt-8">5. Forfeiture and Sale of Unredeemed Goods</h2>
          <p>If the Collateral is not redeemed by the end of the Redemption Period (including any extensions), PawnPass is required by section 14(3) of the Second-hand Dealers and Pawnbrokers Act 1996 (SA) to sell the goods as soon as reasonably practicable in a manner conducive to securing the best price reasonably obtainable.</p>

          <h3 className="text-base font-semibold text-white mt-4">5.1 Residual Equity</h3>
          <p>If the proceeds of the sale exceed the total amount owed to PawnPass, a residual equity amount may be payable to the Pledgor, calculated as follows:</p>
          <div className="rounded-lg p-4 mt-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm text-gray-300 font-mono">Residual Equity (RE) = Sale Price − (Loan Principal + Interest Owed + Cost of Sale)</p>
          </div>
          <p className="mt-2">Where <strong className="text-white">Cost of Sale (COS)</strong> = 51% of sale price + 0.04% per day of the outstanding balance until the item is sold or disposed of.</p>
          <p className="mt-2">If the residual equity amount is positive, PawnPass will pay the balance to the Pledgor. If the sale proceeds do not exceed the total amount owed, no residual equity is payable. The Pledgor may request an inspection of the record of sale.</p>

          <h2 className="text-lg font-semibold text-white mt-8">6. Interest and Fees</h2>
          <p>Interest is charged monthly on the principal. The interest rate is [RATE]% per month. There are no establishment fees, monthly fees, late fees, or dishonour fees. No fees or charges are charged in addition to interest.</p>

          <h2 className="text-lg font-semibold text-white mt-8">7. Pledgor Representations</h2>
          <p>The Pledgor represents that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The Pledgor is the legal owner of the Collateral and has the right to pawn it</li>
            <li>The Collateral is not stolen goods</li>
            <li>The Collateral is not subject to any other security interest, lien, or encumbrance</li>
            <li>The Pledgor is 18 years of age or older</li>
            <li>The information provided to PawnPass is true and accurate</li>
          </ul>

          <h2 className="text-lg font-semibold text-white mt-8">8. Insurance and Risk</h2>
          <p>The Collateral remains at the risk of the Pledgor while in transit to PawnPass. PawnPass does not accept responsibility for loss or damage occurring during postage, shipping, or transport to the hub, whether by Australia Post, courier, or any other method. The Pledgor is responsible for ensuring adequate transit insurance when shipping items to PawnPass.</p>
          <p>Once received at the PawnPass hub, items are stored under PawnPass's contents insurance policy, which provides coverage in the event of a major incident such as fire or break-in. This policy covers the aggregate loss to the premises and is not item-specific. PawnPass does not carry individual item insurance for stored goods and accepts no liability for loss or damage to individual items while in storage beyond what is recoverable under the contents insurance policy.</p>
          <p>The Pledgor acknowledges and accepts these insurance arrangements as a condition of the loan.</p>

          <h2 className="text-lg font-semibold text-white mt-8">9. Privacy and Records</h2>
          <p>PawnPass maintains records of this transaction as required by the Second-hand Dealers and Pawnbrokers Act 1996 (SA). Records are retained for 5 years. Transaction details may be provided to South Australia Police upon request. Your personal information is protected by Australian privacy law and is not sold to third parties.</p>

          <h2 className="text-lg font-semibold text-white mt-8">10. Governing Law</h2>
          <p>This agreement is governed by the laws of South Australia. Any dispute is subject to the jurisdiction of the courts of South Australia. This agreement is made under and subject to the Second-hand Dealers and Pawnbrokers Act 1996 (SA) and the Second-hand Dealers and Pawnbrokers Regulations 2013 (SA). Any term inconsistent with the Act is void to the extent of the inconsistency.</p>

          <h2 className="text-lg font-semibold text-white mt-8">11. Contact</h2>
          <p>PawnPass Pty Ltd<br />311 North East Road, Hampstead Gardens SA 5086<br />info@pawnpass.com.au · 0439 726 576</p>

          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-gray-500 mb-2">PLEDGOR SIGNATURE</p>
                <div className="h-16 border-b border-white/20"></div>
                <p className="text-xs text-gray-500 mt-2">[CUSTOMER_NAME]</p>
                <p className="text-xs text-gray-500">Date: [DATE]</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">PAWNBROKER</p>
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
              <strong>Pawn Ticket ID:</strong> [LOAN_ID] · <strong>Issued:</strong> [ISSUED_AT] · <strong>Unique Code:</strong> [ID_CODE]
            </p>
            <p className="text-xs text-gray-400 mt-2">
              This pawn ticket is issued in accordance with section 13 of the Second-hand Dealers and Pawnbrokers Act 1996 (SA) and regulation 11 of the Second-hand Dealers and Pawnbrokers Regulations 2013 (SA).
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}