"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";

interface Locker {
  id: string;
  name: string;
  address: string;
  distance_km: number;
  hours: string;
  max_dimensions: string;
  max_weight: string;
}

export default function ShippingPage() {
  const { quote, shipment, setShipment } = useApp();
  const [step, setStep] = useState<"select" | "locker" | "confirm" | "success">("select");
  const [deliveryOption, setDeliveryOption] = useState<"locker" | "home" | "">("");
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [loading, setLoading] = useState(false);
  const [postcode, setPostcode] = useState("5086");
  const [pickupAddress, setPickupAddress] = useState("");

  // Item info from saved quote (or defaults if no quote)
  const itemWeight = 0.5;
  const itemValue = quote?.loan_amount || 500;
  const itemDescription = quote
    ? `${quote.brand || ""} ${quote.model || ""}`.trim() || quote.category
    : "Pawn loan collateral";

  useEffect(() => {
    if (deliveryOption === "locker") {
      fetchLockers();
    }
  }, [deliveryOption]);

  async function fetchLockers() {
    setLoading(true);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "find_lockers", postcode }),
      });
      const data = await res.json();
      setLockers(data.lockers || []);
    } catch (err) {
      console.error("Failed to fetch lockers:", err);
    }
    setLoading(false);
  }

  async function createShipment() {
    setLoading(true);
    try {
      const customerAddress = selectedLocker
        ? { lines: [selectedLocker.address], suburb: "", state: "SA", postcode }
        : { lines: [pickupAddress], suburb: "", state: "SA", postcode: "" };

      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_shipment",
          direction: "inbound",
          customerName: "Customer",
          customerAddress,
          customerPhone: "0439726576",
          itemWeight,
          itemValue,
          itemDescription,
          lockerId: selectedLocker?.id,
        }),
      });
      const data = await res.json();
      setShipment(data);

      // Create the loan — read quote from context or localStorage fallback
      const activeQuote = quote || (() => {
        try { return JSON.parse(localStorage.getItem("pawnpass_quote") || "null"); } catch { return null; }
      })();

      if (activeQuote) {
        const loanRes = await fetch("/api/loans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_loan",
            itemDescription,
            loanAmount: activeQuote.loan_amount,
            interestRate: activeQuote.interest_rate,
            isGold: activeQuote.is_gold,
            trackingNumber: data.tracking_number,
          }),
        });
        const loanData = await loanRes.json();
        if (!loanData.success) {
          console.error("Loan creation failed:", loanData);
        }
      }

      setStep("success");
    } catch (err) {
      console.error("Failed to create shipment:", err);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-6 md:px-12 lg:px-20 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "#FF6B00" }}>P</div>
            <span className="text-xl font-bold tracking-tight">PawnPass</span>
          </div>
          <a href="/" className="text-sm font-medium text-gray-600 hover:text-black">← Back to home</a>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {["Quote", "Shipping", "Payment"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                i === 1 ? "text-white" : "text-gray-400 bg-gray-200"
              }`} style={i === 1 ? { background: "#FF6B00" } : {}}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${i === 1 ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
              {i < 2 && <div className="w-12 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* STEP: Select delivery option */}
        {step === "select" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Ship your item to us</h1>
            <p className="text-gray-600 mb-8">Choose how you want to send your item to the PawnPass hub for verification.</p>

            <div className="space-y-4">
              {/* Parcel Locker */}
              <button
                onClick={() => { setDeliveryOption("locker"); setStep("locker"); }}
                className="w-full text-left rounded-2xl p-6 border-2 border-gray-200 hover:border-orange-500 transition-all bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#FFF3E6" }}>
                    <svg className="w-6 h-6" style={{ color: "#FF6B00" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Drop at Parcel Locker</h3>
                    <p className="text-sm text-gray-600">24/7 availability. Digital QR code — no printing. Nearest: Greenacres (across the road).</p>
                  </div>
                  <div className="text-gray-400 mt-1">→</div>
                </div>
              </button>

              {/* Home pickup */}
              <button
                onClick={() => { setDeliveryOption("home"); setStep("confirm"); }}
                className="w-full text-left rounded-2xl p-6 border-2 border-gray-200 hover:border-orange-500 transition-all bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#FFF3E6" }}>
                    <svg className="w-6 h-6" style={{ color: "#FF6B00" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Home / Office Pickup</h3>
                    <p className="text-sm text-gray-600">On-demand courier comes to you. Premium service — extra fees apply.</p>
                  </div>
                  <div className="text-gray-400 mt-1">→</div>
                </div>
              </button>
            </div>

            {/* Item summary */}
            <div className="mt-8 rounded-2xl p-6 bg-white border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-500 mb-4">YOUR QUOTE</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Item</span><span className="font-medium">{itemDescription}</span></div>
                {quote && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Loan amount</span><span className="font-medium" style={{ color: "#FF6B00" }}>${quote.loan_amount}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Interest rate</span><span className="font-medium">{quote.interest_rate}/month</span></div>
                    {quote.is_gold && <div className="flex justify-between"><span className="text-gray-500">Gold rate</span><span className="font-medium" style={{ color: "#00A87E" }}>25% discount ✓</span></div>}
                  </>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Weight</span><span className="font-medium">{itemWeight} kg</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Insured value</span><span className="font-medium" style={{ color: "#FF6B00" }}>${itemValue}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP: Select locker */}
        {step === "locker" && (
          <div>
            <button onClick={() => setStep("select")} className="text-sm text-gray-500 mb-4">← Back</button>
            <h1 className="text-3xl font-bold mb-2">Choose a Parcel Locker</h1>
            <p className="text-gray-600 mb-6">Select a 24/7 locker near you to drop off your item.</p>

            {/* Postcode search */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Enter postcode"
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
              />
              <button onClick={fetchLockers} className="rounded-lg px-5 py-2.5 text-sm font-medium text-white" style={{ background: "#FF6B00" }}>
                Search
              </button>
            </div>

            {loading && <p className="text-sm text-gray-500">Finding lockers near you...</p>}

            <div className="space-y-3">
              {lockers.map((locker) => (
                <button
                  key={locker.id}
                  onClick={() => { setSelectedLocker(locker); setStep("confirm"); }}
                  className="w-full text-left rounded-xl p-5 border border-gray-200 hover:border-orange-500 transition-all bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">{locker.name}</h3>
                      <p className="text-sm text-gray-500">{locker.address}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{locker.hours}</span>
                        <span>•</span>
                        <span>Max {locker.max_weight}</span>
                        <span>•</span>
                        <span>Max {locker.max_dimensions}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold" style={{ color: "#FF6B00" }}>{locker.distance_km} km</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Confirm */}
        {step === "confirm" && (
          <div>
            <button onClick={() => setStep(deliveryOption === "locker" ? "locker" : "select")} className="text-sm text-gray-500 mb-4">← Back</button>
            <h1 className="text-3xl font-bold mb-2">Confirm your shipment</h1>
            <p className="text-gray-600 mb-8">Review the details below and generate your shipping label.</p>

            <div className="rounded-2xl p-6 bg-white border border-gray-200 space-y-4">
              {/* Delivery method */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-gray-500">Delivery method</span>
                <span className="text-sm font-semibold">
                  {deliveryOption === "locker" ? "📦 Parcel Locker" : "🏠 Home Pickup"}
                </span>
              </div>

              {/* Locker details */}
              {deliveryOption === "locker" && selectedLocker && (
                <div className="pb-4 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Locker location</span>
                  <p className="text-sm font-semibold mt-1">{selectedLocker.name}</p>
                  <p className="text-sm text-gray-500">{selectedLocker.address}</p>
                </div>
              )}

              {/* Home pickup address */}
              {deliveryOption === "home" && (
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-sm text-gray-500">Pickup address</label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="123 Main Street, Klemzig SA 5087"
                    className="w-full mt-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              {/* Insurance */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <span className="text-sm text-gray-500">Transit insurance</span>
                  <p className="text-xs text-gray-400">Cover up to ${itemValue}</p>
                </div>
                <span className="text-sm font-semibold" style={{ color: "#00A87E" }}>✓ Included</span>
              </div>

              {/* Tracking */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tracking</span>
                <span className="text-sm font-semibold">AusPost tracking + SMS updates</span>
              </div>
            </div>

            <button
              onClick={createShipment}
              disabled={loading}
              className="w-full mt-6 rounded-full py-4 text-base font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: "#FF6B00" }}
            >
              {loading ? "Generating..." : "Generate shipping label →"}
            </button>
          </div>
        )}

        {/* STEP: Success */}
        {step === "success" && shipment && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "#00A87E" }}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Your label is ready!</h1>
            <p className="text-gray-600 mb-8">
              {deliveryOption === "locker"
                ? "Take your item to the locker. Scan the QR code or show the label. You'll get an SMS when we receive it."
                : "We'll SMS you a pickup time window. Have your item ready for the courier."}
            </p>

            {/* QR code placeholder */}
            <div className="rounded-2xl p-8 bg-white border border-gray-200 mb-6">
              <div className="w-48 h-48 mx-auto rounded-lg flex items-center justify-center text-gray-400 mb-4"
                style={{ background: "repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #e0e0e0 10px, #e0e0e0 20px)" }}>
                <span className="text-sm font-mono">QR CODE</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Tracking #</span><span className="font-mono font-medium">{shipment.tracking_number}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shipment ID</span><span className="font-mono">{shipment.shipment_id}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Insurance</span><span className="font-medium" style={{ color: "#00A87E" }}>Covered to ${itemValue}</span></div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <a href="/dashboard" className="rounded-full px-8 py-3 text-sm font-medium text-white" style={{ background: "#FF6B00" }}>
                View my dashboard →
              </a>
              <button className="rounded-full px-8 py-3 text-sm font-medium border-2 border-gray-300">
                Download label
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
