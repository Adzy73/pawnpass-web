"use client";

import { useState } from "react";
import { useApp } from "@/lib/AppContext";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import LogoHeader from "@/components/LogoHeader";

const MYPOST_ID = process.env.NEXT_PUBLIC_AUSPOST_MYPOST_ID || "1000146016";

const HUB_LOCKER = {
  recipient: "PawnPass",
  lockerLine: "Parcel Locker 51",
  apcnLine: `1000146016 (MyPost / APCN No.)`,
  locationLine: "Greenacres Shopping Centre, 152 Mullers Rd",
  suburbStatePostcode: "GREENACRES SA 5086",
};

export default function ShippingPage() {
  const { quote, shipment, setShipment } = useApp();
  const [step, setStep] = useState<"select" | "walkthrough" | "home" | "success">("select");
  const [deliveryOption, setDeliveryOption] = useState<"locker" | "home">("locker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Walkthrough interactive state
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showVideos, setShowVideos] = useState(false);
  const [lodgementMethod, setLodgementMethod] = useState<"parcel_locker" | "post_office" | "auspost_app">("parcel_locker");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [returnAddress, setReturnAddress] = useState("");

  // Home pickup state
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");

  // Item info from saved quote (or defaults if no quote)
  const itemValue = quote?.loan_amount || 500;
  const itemDescription = quote
    ? `${quote.brand || ""} ${quote.model || ""}`.trim() || quote.category
    : "Pawn loan collateral";
  const referenceCode = `PP-REF-${String(itemValue)}${new Date().getDate().toString().padStart(2, "0")}`;

  function copyText(label: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setCompletedSteps((prev) => ({ ...prev, 2: true }));
    setTimeout(() => setCopiedField(null), 2200);
  }

  function toggleStepCheck(stepNum: number) {
    setCompletedSteps((prev) => ({ ...prev, [stepNum]: !prev[stepNum] }));
  }

  async function submitTrackingAndCreateLoan() {
    setError(null);
    const cleaned = trackingNumber.trim().toUpperCase();
    if (!cleaned || cleaned.length < 6) {
      setError("Please enter your Australia Post tracking number (found below the barcode on your satchel or in your AusPost app).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_manual_tracking",
          trackingNumber: cleaned,
          lodgementMethod,
          returnAddress,
          itemValue,
          itemDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not register tracking number.");
        setLoading(false);
        return;
      }

      setShipment(data);

      // Create the loan in PostgreSQL with the customer's real tracking number
      const activeQuote =
        quote ||
        (() => {
          try {
            return JSON.parse(localStorage.getItem("pawnpass_quote") || "null");
          } catch {
            return null;
          }
        })();

      await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_loan",
          itemDescription,
          loanAmount: activeQuote?.loan_amount || itemValue,
          interestRate: activeQuote?.interest_rate || "35.00%",
          isGold: activeQuote?.is_gold || false,
          trackingNumber: cleaned,
        }),
      });

      setStep("success");
    } catch {
      setError("Network error while submitting your tracking number. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitHomePickup() {
    if (!pickupAddress) {
      setError("Please enter your pickup address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_shipment",
          direction: "inbound",
          customerName: "Customer",
          customerAddress: { lines: [pickupAddress], suburb: "Adelaide", state: "SA", postcode: "5000" },
          customerPhone: pickupPhone || "0400000000",
          itemWeight: 0.5,
          itemValue,
          itemDescription,
        }),
      });
      const data = await res.json();
      setShipment(data);

      const activeQuote =
        quote ||
        (() => {
          try {
            return JSON.parse(localStorage.getItem("pawnpass_quote") || "null");
          } catch {
            return null;
          }
        })();

      await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_loan",
          itemDescription,
          loanAmount: activeQuote?.loan_amount || itemValue,
          interestRate: activeQuote?.interest_rate || "35.00%",
          isGold: activeQuote?.is_gold || false,
          trackingNumber: data.tracking_number,
        }),
      });

      setStep("success");
    } catch {
      setError("Failed to book courier pickup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fullFormattedAddress = `${HUB_LOCKER.recipient}\n${HUB_LOCKER.lockerLine}\n${HUB_LOCKER.locationLine}\n${HUB_LOCKER.suburbStatePostcode}`;

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LogoHeader backLink="/quote" backLabel="← Back to Quote" mode="customer" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8 sm:mb-10">
          {["1. Quote", "2. Send to Hub", "3. Osko Payout"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                  i === 1 ? "text-white" : i === 0 ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30" : "text-gray-500"
                }`}
                style={i === 1 ? { background: "#FF6B00" } : i === 2 ? { background: "rgba(255,255,255,0.06)" } : undefined}
              >
                {i === 0 ? "✓ Quote" : label}
              </div>
              {i < 2 && <div className="w-6 sm:w-10 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl p-4 bg-amber-500/15 border border-amber-500/40 text-sm text-amber-300">
            ⚠ {error}
          </div>
        )}

        {/* ─── STEP 0: SELECT DELIVERY METHOD ─── */}
        {step === "select" && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">Send your item to our Hub</h1>
            <p className="text-sm text-gray-400 mb-6">
              We use Australia Post&apos;s 24/7 Parcel Locker network so you can drop off your item anytime with zero storefront visits.
            </p>

            <div className="space-y-4">
              {/* Primary Option: 24/7 AusPost Parcel Locker Walkthrough */}
              <button
                onClick={() => {
                  setDeliveryOption("locker");
                  setStep("walkthrough");
                }}
                className="w-full text-left rounded-2xl p-5 sm:p-6 border-2 border-[#FF6B00]/60 hover:border-[#FF6B00] transition-all bg-[#FF6B00]/[0.05] hover:scale-[1.01]"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(255,107,0,0.18)" }}
                  >
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-white">24/7 Australia Post Parcel Locker</h3>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        +$15 POSTAGE REBATE INCLUDED
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Step-by-step guide to send your item to our secure Greenacres 24/7 Parcel Locker from any Parcel Locker or Post Office near you.
                    </p>
                    <p className="text-xs text-[#FF6B00] font-semibold mt-2">
                      Start 4-step send walkthrough →
                    </p>
                  </div>
                </div>
              </button>

              {/* Secondary Option: On-Demand Courier */}
              <button
                onClick={() => {
                  setDeliveryOption("home");
                  setStep("home");
                }}
                className="w-full text-left rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-white/30 transition-all bg-white/[0.02]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/5">
                    🚗
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg mb-1 text-white">
                      Adelaide Metro On-Demand Courier Pickup
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Direct point-to-point courier pickup from your home or office straight to our Hampstead Gardens Hub.
                    </p>
                  </div>
                  <div className="text-gray-500 mt-1">→</div>
                </div>
              </button>
            </div>

            {/* Active Quote Summary Card */}
            <div className="mt-8 rounded-2xl p-5 sm:p-6 bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono tracking-wider text-gray-400 uppercase">YOUR LOCKED-IN QUOTE</h4>
                <span className="text-xs font-mono text-[#FF6B00]">{referenceCode}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Item</span>
                  <span className="font-semibold text-white">{itemDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Principal Offer</span>
                  <span className="font-bold text-lg" style={{ color: "#FF6B00" }}>
                    ${itemValue}
                  </span>
                </div>
                {quote?.interest_rate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Interest Rate</span>
                    <span className="font-medium text-gray-200">{quote.interest_rate}/month</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-emerald-400">Express Postage Rebate</span>
                  <span className="font-semibold text-emerald-400">+$15.00 added on verification</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 1–4: PARCEL LOCKER WALKTHROUGH ─── */}
        {step === "walkthrough" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep("select")}
                className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Change delivery method
              </button>
              <span className="text-xs font-mono text-[#FF6B00]">FIG.02 // PARCEL LOCKER WALKTHROUGH</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                How to Send Your Item via Parcel Locker
              </h1>
              <p className="text-sm text-gray-400">
                Follow these 4 simple steps. Once your package lands in our nominated Greenacres Parcel Locker, we collect, verify, and release your Osko payout.
              </p>
            </div>

            {/* ── WALKTHROUGH STEP 1: PACK & SATCHEL ── */}
            <div
              className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                completedSteps[1]
                  ? "bg-emerald-500/[0.04] border-emerald-500/40"
                  : "bg-white/[0.03] border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: completedSteps[1] ? "#00A87E" : "#FF6B00" }}
                  >
                    {completedSteps[1] ? "✓" : "1"}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      Step 1: Pack Your Item & Get a Prepaid Satchel or Label
                    </h2>
                    <p className="text-xs text-gray-400">Max size: 35 × 44 × 61 cm · Max weight: 16 kg</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleStepCheck(1)}
                  className="text-xs px-3 py-1 rounded-full border border-white/15 text-gray-300 hover:text-white shrink-0"
                >
                  {completedSteps[1] ? "Done ✓" : "Mark done"}
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-gray-300 pl-0 sm:pl-11">
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 block text-xs">WRITE THIS REFERENCE INSIDE YOUR PARCEL:</span>
                    <span className="font-mono font-bold text-base text-[#FF6B00]">{referenceCode}</span>
                    <span className="text-gray-400 text-xs ml-2">({itemDescription})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText("ref", referenceCode)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    {copiedField === "ref" ? "Copied ✓" : "Copy ID"}
                  </button>
                </div>

                <ul className="space-y-2 text-gray-300 list-disc list-inside">
                  <li>
                    <strong>Wrap securely:</strong> Cushion your item with bubble wrap so it cannot move in transit.
                  </li>
                  <li>
                    <strong>Get a barcoded satchel or label (choose either):</strong>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <p className="font-semibold text-white text-xs mb-1">🅰 Prepaid Express Post Satchel</p>
                        <p className="text-xs text-gray-400">
                          Grab a yellow Express Post satchel (~$12–$15) from any Post Office, Coles, or Woolworths. It already has a tracking barcode attached.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <p className="font-semibold text-white text-xs mb-1">🅱 AusPost Smartphone App</p>
                        <p className="text-xs text-gray-400">
                          Open the free <strong>AusPost App</strong> → tap <strong>&ldquo;Send a parcel&rdquo;</strong> → pay in-app, print your label, and stick it onto your box.
                        </p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* ── WALKTHROUGH STEP 2: COPY OUR NOMINATED HUB PARCEL LOCKER ADDRESS ── */}
            <div
              className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                completedSteps[2]
                  ? "bg-emerald-500/[0.04] border-emerald-500/40"
                  : "bg-white/[0.03] border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: completedSteps[2] ? "#00A87E" : "#FF6B00" }}
                  >
                    {completedSteps[2] ? "✓" : "2"}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      Step 2: Address Your Parcel to Our Nominated Hub Locker
                    </h2>
                    <p className="text-xs text-gray-400">
                      Write this exact address on your satchel or paste it into the AusPost app
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText("full", fullFormattedAddress)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white shrink-0 transition-transform hover:scale-105"
                  style={{ background: "#FF6B00" }}
                >
                  {copiedField === "full" ? "✓ Full Address Copied!" : "📋 Copy Full Address"}
                </button>
              </div>

              <div className="pl-0 sm:pl-11 space-y-2.5">
                {[
                  { key: "recipient", label: "RECIPIENT / TO", value: HUB_LOCKER.recipient },
                  { key: "locker", label: "ADDRESS LINE 1", value: HUB_LOCKER.lockerLine, highlight: true },
                  { key: "apcn", label: "MYPOST CUSTOMER / APCN NO.", value: HUB_LOCKER.apcnLine, highlight: true },
                  { key: "loc", label: "ADDRESS LINE 2 (LOCATION)", value: HUB_LOCKER.locationLine },
                  { key: "suburb", label: "SUBURB / STATE / POSTCODE", value: HUB_LOCKER.suburbStatePostcode },
                ].map((row) => (
                  <div
                    key={row.key}
                    className={`flex items-center justify-between gap-2 p-3 rounded-xl border ${
                      row.highlight
                        ? "bg-[#FF6B00]/10 border-[#FF6B00]/40"
                        : "bg-black/50 border-white/10"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block text-[10px] font-mono text-gray-400">{row.label}</span>
                      <span className="font-mono text-xs sm:text-sm font-bold text-white break-all">
                        {row.value}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(row.key, row.value)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-200 shrink-0"
                    >
                      {copiedField === row.key ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                ))}

                <p className="text-xs text-gray-400 pt-1">
                  🔒 <strong>Why a Parcel Locker?</strong> Your parcel goes straight into Australia Post&apos;s 24/7 monitored locker vault at Greenacres (across the road from our Hampstead Gardens inspection hub) and notifies our team the second it arrives.
                </p>
              </div>
            </div>

            {/* ── WALKTHROUGH STEP 3: DROP AT ANY 24/7 PARCEL LOCKER + VIDEO WALKTHROUGHS ── */}
            <div
              className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                completedSteps[3]
                  ? "bg-emerald-500/[0.04] border-emerald-500/40"
                  : "bg-white/[0.03] border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: completedSteps[3] ? "#00A87E" : "#FF6B00" }}
                  >
                    {completedSteps[3] ? "✓" : "3"}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      Step 3: Lodge at Any 24/7 Parcel Locker (or Post Office)
                    </h2>
                    <p className="text-xs text-gray-400">
                      Take your labelled package and your mobile phone to any Australia Post Parcel Locker
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleStepCheck(3)}
                  className="text-xs px-3 py-1 rounded-full border border-white/15 text-gray-300 hover:text-white shrink-0"
                >
                  {completedSteps[3] ? "Done ✓" : "Mark done"}
                </button>
              </div>

              <div className="pl-0 sm:pl-11 space-y-4">
                {/* 4 Visual Cards matching the AusPost Videos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <div className="text-xs font-mono text-[#FF6B00] mb-1">3A // AT THE LOCKER SCREEN</div>
                    <p className="text-xs sm:text-sm font-semibold text-white mb-1">Tap &ldquo;Drop Off&rdquo; or Scan App QR</p>
                    <p className="text-xs text-gray-400">
                      On the Parcel Locker touchscreen, select <strong>Drop off</strong> (or tap <strong>Open Locker</strong> in your AusPost app to scan the screen QR code).
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <div className="text-xs font-mono text-[#FF6B00] mb-1">3B // SMS VERIFICATION</div>
                    <p className="text-xs sm:text-sm font-semibold text-white mb-1">Enter Mobile & SMS Code</p>
                    <p className="text-xs text-gray-400">
                      Enter your mobile number on the locker touchscreen. Australia Post will text you a one-time verification code to unlock a compartment.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <div className="text-xs font-mono text-[#FF6B00] mb-1">3C // SCAN PARCEL BARCODE</div>
                    <p className="text-xs sm:text-sm font-semibold text-white mb-1">Scan Satchel & Pick Door Size</p>
                    <p className="text-xs text-gray-400">
                      Hold your prepaid satchel or printed label barcode under the locker scanner and choose Small, Medium, or Large door.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <div className="text-xs font-mono text-[#FF6B00] mb-1">3D // DEPOSIT & CLOSE</div>
                    <p className="text-xs sm:text-sm font-semibold text-white mb-1">Place Inside & Close Firmly</p>
                    <p className="text-xs text-gray-400">
                      Place your parcel inside the locker door that pops open and shut it firmly. Do not use red street post boxes (no scan receipt).
                    </p>
                  </div>
                </div>

                {/* Embedded Video Walkthrough Toggle */}
                <div className="rounded-xl border border-white/10 bg-black/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowVideos(!showVideos)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🎥</span>
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-white block">
                          Watch Official 60-Second Parcel Locker Video Walkthroughs
                        </span>
                        <span className="text-[11px] text-gray-400">
                          See how to send &amp; receive using an Australia Post Parcel Locker
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#FF6B00]">
                      {showVideos ? "Hide Videos ▲" : "Watch Videos ▼"}
                    </span>
                  </button>

                  {showVideos && (
                    <div className="p-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-300 mb-2">
                          1. Sending &amp; Receiving with Parcel Lockers (2:05)
                        </p>
                        <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-black">
                          <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/emfLbuo3644"
                            title="Australia Post Parcel Lockers Send and Receive Guide"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-300 mb-2">
                          2. Quick Parcel Locker Address &amp; QR Demo (1:01)
                        </p>
                        <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-black">
                          <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/V4K77M0X3EY"
                            title="How to use Australia Post Parcel Locker"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── WALKTHROUGH STEP 4: ENTER TRACKING NUMBER & CONFIRM ── */}
            <div className="rounded-2xl p-5 sm:p-6 bg-white/[0.04] border-2 border-[#FF6B00]/50">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: "#FF6B00" }}
                >
                  4
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Step 4: Enter Your Australia Post Tracking Number
                  </h2>
                  <p className="text-xs text-gray-400">
                    Links your package to your PawnPass account so we can inspect and pay you via Osko
                  </p>
                </div>
              </div>

              <div className="pl-0 sm:pl-11 space-y-4">
                {/* Where did you lodge it? */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    How are you lodging your parcel?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "parcel_locker", label: "📦 24/7 Locker" },
                      { id: "post_office", label: "🏣 Post Office" },
                      { id: "auspost_app", label: "📱 AusPost App" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setLodgementMethod(m.id as any)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          lodgementMethod === m.id
                            ? "border-[#FF6B00] bg-[#FF6B00]/15 text-white"
                            : "border-white/10 bg-black/40 text-gray-400 hover:text-white"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tracking Number Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-200">
                      Australia Post Tracking Number *
                    </label>
                    <button
                      type="button"
                      onClick={() => setTrackingNumber(`33PP${Math.floor(10000000 + Math.random() * 90000000)}`)}
                      className="text-[11px] font-mono text-[#FF6B00] hover:underline"
                    >
                      + Fill sample tracking # (Demo)
                    </button>
                  </div>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. 33PP9912039201 or R4291049281AU"
                    className="w-full rounded-xl border border-white/15 bg-black px-4 py-3.5 text-base font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Found on the peel-off receipt of your Prepaid Express Post Satchel or inside your AusPost App.
                  </p>
                </div>

                {/* Optional Return Parcel Locker / Address for Redemptions */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Your Return Address or Your Own 10-Digit Parcel Locker Address (Optional — for when you redeem)
                  </label>
                  <input
                    type="text"
                    value={returnAddress}
                    onChange={(e) => setReturnAddress(e.target.value)}
                    placeholder="e.g. Parcel Locker 1012345678, Modbury SA 5092 (or home address)"
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-xs sm:text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <button
                  type="button"
                  onClick={submitTrackingAndCreateLoan}
                  disabled={loading}
                  className="w-full rounded-full py-4 text-sm sm:text-base font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-50 shadow-lg"
                  style={{ background: "#FF6B00", boxShadow: "0 0 25px rgba(255,107,0,0.35)" }}
                >
                  {loading ? "Registering Tracking Number…" : "Confirm Shipment & Lock In My Loan →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── HOME / OFFICE COURIER PICKUP FLOW ─── */}
        {step === "home" && (
          <div className="space-y-6">
            <button
              onClick={() => setStep("select")}
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to shipping options
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Book On-Demand Courier Pickup</h1>
            <p className="text-sm text-gray-400">
              We dispatch a point-to-point courier to collect your packaged item and bring it directly to 311 North East Road, Hampstead Gardens.
            </p>

            <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/10 space-y-4">
              <AddressAutocomplete
                label="Your Pickup Address (Adelaide Metro)"
                placeholder="Start typing your street address..."
                value={pickupAddress}
                onChange={(val) => setPickupAddress(val)}
                required
              />
              <div>
                <label className="block text-sm text-gray-400 mb-2">Mobile number for driver SMS</label>
                <input
                  type="tel"
                  value={pickupPhone}
                  onChange={(e) => setPickupPhone(e.target.value)}
                  placeholder="04xx xxx xxx"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>

            <button
              onClick={submitHomePickup}
              disabled={loading || !pickupAddress}
              className="w-full rounded-full py-4 text-base font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-40"
              style={{ background: "#FF6B00" }}
            >
              {loading ? "Booking Courier…" : "Confirm Courier Pickup →"}
            </button>
          </div>
        )}

        {/* ─── STEP: SUCCESS / SHIPMENT REGISTERED ─── */}
        {step === "success" && shipment && (
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "#00A87E" }}
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">Shipment Registered!</h1>
            <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">
              Your tracking number is linked to your loan. As soon as Australia Post notifies us that your parcel is in our Greenacres Locker, we&apos;ll collect, verify, and release your Osko payment.
            </p>

            <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/10 mb-6 text-left space-y-3 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-gray-400">AusPost Tracking #</span>
                <span className="font-mono font-bold text-base text-[#FF6B00]">{shipment.tracking_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Destination Hub Locker</span>
                <span className="font-mono text-xs text-gray-200 text-right">
                  {HUB_LOCKER.lockerLine} · Greenacres SA 5086
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reference Inside Box</span>
                <span className="font-mono font-semibold text-white">{referenceCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Loan Principal + Postage Rebate</span>
                <span className="font-bold text-emerald-400">${itemValue} + $15.00 Rebate</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/dashboard"
                className="rounded-full px-8 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: "#FF6B00" }}
              >
                Go to My Customer Dashboard →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
