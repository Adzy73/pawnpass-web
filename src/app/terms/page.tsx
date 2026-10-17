import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8 text-white">Terms of Service</h1>
        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <p>By using PawnPass, you agree to these terms. PawnPass Pty Ltd operates under Australian Credit Licence "Theorify" and is AUSTRAC registered. PawnPass is registered under the Second-hand Dealers and Pawnbrokers Act 1996 (SA).</p>

          <h2 className="text-xl font-semibold text-white mt-8">Pawn loans</h2>
          <p>Pawn loans are secured against physical collateral. Interest is charged monthly. The redemption period is a minimum of one month (we offer 90 days). Monthly interest may be paid to extend the redemption period. If you do not redeem your item within the redemption period, PawnPass is required by law to sell the goods in a manner conducive to securing the best price reasonably obtainable.</p>
          <p>If the proceeds of the sale exceed the total amount owed to PawnPass, a residual equity amount may be payable to you. Residual Equity (RE) = Sale Price − (Loan Principal + Interest Owed + Cost of Sale), where Cost of Sale = 51% of sale price + 0.04% per day of the outstanding balance until the item is sold or disposed of. If the residual equity is positive, PawnPass will pay the balance to you. If sale proceeds do not exceed the total owed, no residual equity is payable.</p>

          <h2 className="text-xl font-semibold text-white mt-8">Interest rates</h2>
          <p>Current rates: Under $1,000: 35%/month. $1,000-$3,000: 25%/month. $3,000-$5,000: 20%/month. Over $5,000: negotiable. Gold and gold jewellery receive a 25% discount on all tiers. There are no establishment fees, monthly fees, or late fees.</p>

          <h2 className="text-xl font-semibold text-white mt-8">Buy outright</h2>
          <p>If you choose to sell your item to PawnPass outright (no loan, no redemption), title transfers to PawnPass upon payment. There is no right of redemption for buy-outright transactions. Prescribed goods (excluding jewellery, watches, and precious metals) are held for a minimum of 10 days before resale as required by the Act.</p>

          <h2 className="text-xl font-semibold text-white mt-8">Provisional quotes</h2>
          <p>All quotes provided by PawnPass are provisional and subject to physical inspection at our hub. If the item's condition or model differs from the description provided, PawnPass may issue a counter-offer. You may accept the counter-offer or decline and have your item returned at no cost.</p>

          <h2 className="text-xl font-semibold text-white mt-8">Insurance and risk</h2>
          <p>Items remain at your risk while in transit to PawnPass. PawnPass does not accept responsibility for loss or damage during postage, shipping, or transport to the hub. You are responsible for ensuring adequate transit insurance when shipping items to us.</p>
          <p>Once received at the PawnPass hub, items are stored under our contents insurance policy, which covers major incidents such as fire or break-in. This is not individual item insurance. PawnPass does not accept liability for loss or damage to individual items while in storage beyond what is recoverable under the contents insurance policy.</p>

          <h2 className="text-xl font-semibold text-white mt-8">Identification</h2>
          <p>Identity verification is required for all transactions, in accordance with the Second-hand Dealers and Pawnbrokers Regulations 2013 (SA) and AUSTRAC requirements. We accept driver's licence, passport, or Medicare card via Stripe Identity. We do not enter into transactions with persons under 18 years of age.</p>

          <h2 className="text-xl font-semibold text-white mt-8">Shipping</h2>
          <p>Items are shipped via Australia Post. Parcel Locker drop-off is available 24/7. Home pickup is available as a premium service. Transit insurance is the responsibility of the customer.</p>

          <h2 className="text-xl font-semibold text-white mt-8">Payment</h2>
          <p>Loan funds and buy-outright payments are disbursed via Osko bank transfer after physical verification at our hub. Funds are not released upon shipment — only after item verification and approval.</p>

          <h2 className="text-xl font-semibold text-white mt-8">Records and privacy</h2>
          <p>PawnPass maintains records of all transactions as required by the Second-hand Dealers and Pawnbrokers Act 1996 (SA). Records are retained for 5 years. Transaction details may be provided to South Australia Police upon request. Your personal information is protected by Australian privacy law and is never sold.</p>

          <h2 className="text-xl font-semibold text-white mt-8">No contracting out</h2>
          <p>These terms are provided in accordance with the Second-hand Dealers and Pawnbrokers Act 1996 (SA). Any term inconsistent with the Act is void to the extent of the inconsistency.</p>

          <h2 className="text-xl font-semibold text-white mt-8">Contact</h2>
          <p>For questions: info@pawnpass.com.au or 0439 726 576. PawnPass Hub: 311 North East Road, Hampstead Gardens SA 5086.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}