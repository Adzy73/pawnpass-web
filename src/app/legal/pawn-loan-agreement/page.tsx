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
            <h1 className="text-2xl font-bold text-white">Pawn Loan Agreement & Pledge Ticket</h1>
            <p className="text-xs text-gray-500">Under the Second-hand Dealers and Pawnbrokers Act 1996 (SA) & Reg 11</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <div className="rounded-xl p-4 border border-[#FF6B00]/30" style={{ background: "rgba(255,107,0,0.06)" }}>
            <p className="text-xs text-gray-300">
              <strong>Non-Recourse Pawn Protection:</strong> This is a non-recourse pawn loan with no personal liability beyond the pledged item. No debt collection actions will be pursued, and your credit file / credit score will not be negatively affected if you choose not to redeem the loan.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-white mt-8">1. Parties & Regulatory Position</h2>
          <p><strong className="text-white">Pawnbroker:</strong> PawnPass Pty Ltd (ABN: TBC), 311 North East Road, Hampstead Gardens SA 5086. Registered under the Second-hand Dealers and Pawnbrokers Act 1996 (SA). Australian Credit Licence: Theorify. AUSTRAC registered.</p>
          <p><strong className="text-white">Pledgor:</strong> [Customer full name], [Residential address], [Date of birth]. Identity verified in accordance with the Second-hand Dealers and Pawnbrokers Regulations 2013 (SA) Regulation 9.</p>

          <h2 className="text-lg font-semibold text-white mt-8">2. Loan Schedule & Statutory APR Disclosure</h2>
          <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
            <tbody>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Loan amount (principal)</td><td className="p-3 text-white font-bold">${`[PRINCIPAL]`}</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Monthly interest charge</td><td className="p-3 text-[#FF6B00] font-bold">{`[RATE]`}%/month (${`[MONTHLY_INTEREST]`})</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Statutory Equivalent Annual Interest Rate (APR)</td><td className="p-3 text-white font-mono">{`[APR_RATE]`} p.a. (SA Reg 11(j))</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Redemption period end date</td><td className="p-3 text-white font-medium">{`[DUE_DATE]`}</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Establishment, monthly &amp; late fees</td><td className="p-3 text-emerald-400 font-medium">$0.00 (Zero extra fees)</td></tr>
            </tbody>
          </table>

          <h2 className="text-lg font-semibold text-white mt-8">3. Collateral Description</h2>
          <p>The loan is secured against the following pledged goods (the &ldquo;Collateral&rdquo;):</p>
          <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
            <tbody>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Item description</td><td className="p-3 text-white font-semibold">{`[ITEM_DESCRIPTION]`}</td></tr>
              <tr className="border-b border-white/10"><td className="p-3 text-gray-400">Serial number / IMEI / Unique Code</td><td className="p-3 text-white font-mono">{`[SERIAL_NUMBER] / [ID_CODE]`}</td></tr>
              <tr><td className="p-3 text-gray-400">Receiving hub &amp; storage location</td><td className="p-3 text-white">Parcel Locker 51 (APCN 1000146016), Greenacres SA 5086 / 311 NE Rd, Hampstead Gardens SA 5086</td></tr>
            </tbody>
          </table>

          <h2 className="text-lg font-semibold text-white mt-8">4. Redemption &amp; Extensions</h2>
          <p>The statutory redemption period is 90 days from the date of this agreement. You may redeem the Collateral at any time by paying the principal plus accrued interest.</p>
          <p>You may extend the agreement by paying the monthly interest amount on or before your due date. To guarantee your collateral is never lost, you may enable the <strong>Auto-Pay Monthly Interest Agreement</strong> in your PawnPass dashboard.</p>

          <h2 className="text-lg font-semibold text-white mt-8">5. Forfeiture and Sale of Unredeemed Goods</h2>
          <p>If the Collateral is not redeemed or extended by the due date, PawnPass is authorized under section 14(3) of the Second-hand Dealers and Pawnbrokers Act 1996 (SA) to take ownership and sell the goods for the best price reasonably obtainable.</p>

          <h2 className="text-lg font-semibold text-white mt-8">6. Pledgor Statutory Declaration &amp; Indemnity</h2>
          <p>The Pledgor declares under statutory penalty that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The Pledgor is 18 years of age or older and mentally competent entering this contract of their own free will and not under the influence of alcohol or drugs.</li>
            <li>The Pledgor is the legal owner of the Collateral and the goods are NOT subject to any encumbrance, lease, finance contract, or third-party claim.</li>
            <li>Should the Pledgor not be the legal owner, the Pledgor agrees to reimburse PawnPass in full for any losses or legal costs incurred.</li>
          </ul>

          <h2 className="text-lg font-semibold text-white mt-8">7. Insurance and Transit Protection</h2>
          <p>Collateral is at the Pledgor&apos;s risk while in transit. Once received at the PawnPass hub, items are held under PawnPass&apos;s contents insurance policy in a secure vault.</p>

          <h2 className="text-lg font-semibold text-white mt-8">8. Complaints &amp; Dispute Resolution</h2>
          <p>PawnPass maintains a formal Dispute Resolution process. Should any disagreement arise, you may contact complaints@pawnpass.com.au or call 0439 726 576.</p>

          <h2 className="text-lg font-semibold text-white mt-8">9. Governing Law</h2>
          <p>This agreement is governed by the laws of South Australia and the Second-hand Dealers and Pawnbrokers Act 1996 (SA).</p>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-xs text-gray-500 font-mono">
              Pawn Ticket ID: {`[LOAN_ID]`} · Issued: {`[ISSUED_AT]`} · SA Pawnbrokers Act Reg 11 Compliant
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}