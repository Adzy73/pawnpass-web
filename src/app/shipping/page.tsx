"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/lib/AppContext";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import LockerMap from "@/components/LockerMap";
import LogoHeader from "@/components/LogoHeader";

interface Locker {
  id: string;
  name: string;
  address: string;
  distance_km: number;
  lat?: number;
  lng?: number;
  hours: string;
  max_dimensions: string;
  max_weight: string;
}

interface PostageResult {
  service: string;
  delivery_time: string;
  total_cost: string;
  costs: { cost: Array<{ item: string; cost: string }> | { item: string; cost: string } };
}

interface PostageService {
  code: string;
  name: string;
  price: string;
  max_extra_cover: number;
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

  // Live AusPost postcode search
  const [suburbQuery, setSuburbQuery] = useState("");
  const [suburbResults, setSuburbResults] = useState<Array<{ postcode: string; location: string; state: string }>>([]);
  const [suburbLoading, setSuburbLoading] = useState(false);
  const [selectedSuburb, setSelectedSuburb] = useState<{ postcode: string; location: string; state: string } | null>(null);

  // Live postage calculation
  const [postageResult, setPostageResult] = useState<PostageResult | null>(null);
  const [postageServices, setPostageServices] = useState<PostageService[]>([]);
  const [selectedService, setSelectedService] = useState<string>("AUS_PARCEL_EXPRESS");
  const [postageLoading, setPostageLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState<number | null>(null);

  // Item info from saved quote (or defaults if no quote)
  const itemWeight = 0.5;
  const itemValue = quote?.loan_amount || 500;
  const itemDescription = quote
    ? `${quote.brand || ""} ${quote.model || ""}`.trim() || quote.category
    : "Pawn loan collateral";

  // Default dimensions for a small parcel (jewellery/phone/watch sized)
  const itemLength = 20;
  const itemWidth = 15;
  const itemHeight = 10;

  // Debounced suburb search via live AusPost API
  useEffect(() => {
    if (!suburbQuery || suburbQuery.length < 3) {
      setSuburbResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSuburbLoading(true);
      try {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "postcode_search", query: suburbQuery }),
        });
        const data = await res.json();
        const localities = data?.localities?.locality;
        if (localities) {
          const arr = Array.isArray(localities) ? localities : [localities];
          setSuburbResults(arr.map((l: any) => ({ postcode: l.postcode, location: l.location, state: l.state })));
        } else {
          setSuburbResults([]);
        }
      } catch {
        setSuburbResults([]);
      }
      setSuburbLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [suburbQuery]);

  // Calculate postage when we have a valid postcode (to hub 5086)
  const calculatePostage = useCallback(async (fromPostcode: string) => {
    if (!fromPostcode || fromPostcode.length !== 4) return;
    setPostageLoading(true);
    try {
      // First get available services
      const servicesRes = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "postage_services",
          fromPostcode,
          toPostcode: "5086",
          weight: itemWeight,
          length: itemLength,
          width: itemWidth,
          height: itemHeight,
        }),
      });
      const servicesData = await servicesRes.json();
      const services = servicesData?.services?.service;
      if (services) {
        const arr = Array.isArray(services) ? services : [services];
        setPostageServices(arr);
      }

      // Then calculate the specific service with Signature + Extra Cover
      const calcRes = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "postage_calc",
          fromPostcode,
          toPostcode: "5086",
          weight: itemWeight,
          length: itemLength,
          width: itemWidth,
          height: itemHeight,
          serviceCode: selectedService,
          optionCode: "AUS_SERVICE_OPTION_SIGNATURE_ON_DELIVERY",
          suboptionCode: "AUS_SERVICE_OPTION_EXTRA_COVER",
          extraCover: Math.min(itemValue, 5000),
        }),
      });
      const calcData = await calcRes.json();
      if (calcData?.postage_result) {
        setPostageResult(calcData.postage_result);
        setShippingCost(parseFloat(calcData.postage_result.total_cost));
      }
    } catch (err) {
      console.error("Postage calculation failed:", err);
    }
    setPostageLoading(false);
  }, [selectedService, itemValue, itemWeight]);

  // Recalculate when service changes
  useEffect(() => {
    if (selectedSuburb?.postcode) {
      calculatePostage(selectedSuburb.postcode);
    }
  }, [selectedService]); // eslint-disable-line react-hooks/exhaustive-deps

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
        : { lines: [pickupAddress], suburb: selectedSuburb?.location || "", state: selectedSuburb?.state || "SA", postcode: selectedSuburb?.postcode || "" };

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

  function handleSuburbSelect(s: { postcode: string; location: string; state: string }) {
    setSelectedSuburb(s);
    setPostcode(s.postcode);
    setSuburbQuery(`${s.location}, ${s.state} ${s.postcode}`);
    setSuburbResults([]);
    calculatePostage(s.postcode);
  }

  // Parse postage cost breakdown
  function getCostBreakdown(result: PostageResult): Array<{ item: string; cost: string }> {
    if (Array.isArray(result.costs?.cost)) return result.costs.cost;
    if (result.costs?.cost) return [result.costs.cost];
    return [{ item: result.service, cost: result.total_cost }];
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      {/* Header — dark glassmorphism */}
      <LogoHeader backLink="/quote" backLabel="← Back to quote" />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {["Quote", "Shipping", "Payment"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i === 1 ? "text-white" : "text-gray-500"
                }`}
                style={i === 1 ? { background: "#FF6B00" } : { background: "rgba(255,255,255,0.06)" }}
              >
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${i === 1 ? "text-white" : "text-gray-500"}`}>{label}</span>
              {i < 2 && <div className="w-12 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />}
            </div>
          ))}
        </div>

        {/* STEP: Select delivery option */}
        {step === "select" && (
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Ship your item to us</h1>
            <p className="text-sm text-gray-400 mb-8">Choose how you want to send your item to the PawnPass hub for verification.</p>

            <div className="space-y-4">
              {/* Parcel Locker */}
              <button
                onClick={() => { setDeliveryOption("locker"); setStep("locker"); }}
                className="w-full text-left rounded-2xl p-6 border-2 border-white/10 hover:border-[#FF6B00] transition-all bg-white/[0.03] hover:scale-[1.01]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,107,0,0.12)" }}>
                    <svg className="w-6 h-6" style={{ color: "#FF6B00" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-white">Drop at Parcel Locker</h3>
                    <p className="text-sm text-gray-400">24/7 availability. Digital QR code — no printing. Nearest: Greenacres (across the road).</p>
                  </div>
                  <div className="text-gray-500 mt-1">→</div>
                </div>
              </button>

              {/* Home pickup */}
              <button
                onClick={() => { setDeliveryOption("home"); setStep("confirm"); }}
                className="w-full text-left rounded-2xl p-6 border-2 border-white/10 hover:border-[#FF6B00] transition-all bg-white/[0.03] hover:scale-[1.01]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,107,0,0.12)" }}>
                    <svg className="w-6 h-6" style={{ color: "#FF6B00" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-white">Home / Office Pickup</h3>
                    <p className="text-sm text-gray-400">On-demand courier comes to you. Premium service — extra fees apply.</p>
                  </div>
                  <div className="text-gray-500 mt-1">→</div>
                </div>
              </button>
            </div>

            {/* Item summary */}
            <div className="mt-8 rounded-2xl p-6 bg-white/[0.03] border border-white/10">
              <h4 className="text-sm font-semibold text-gray-400 mb-4">YOUR QUOTE</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Item</span><span className="font-medium text-gray-100">{itemDescription}</span></div>
                {quote && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-400">Loan amount</span><span className="font-medium" style={{ color: "#FF6B00" }}>${quote.loan_amount}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Interest rate</span><span className="font-medium text-gray-100">{quote.interest_rate}/month</span></div>
                    {quote.is_gold && <div className="flex justify-between"><span className="text-gray-400">Gold rate</span><span className="font-medium" style={{ color: "#00A87E" }}>25% discount ✓</span></div>}
                  </>
                )}
                <div className="flex justify-between"><span className="text-gray-400">Weight</span><span className="font-medium text-gray-100">{itemWeight} kg</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Insured value</span><span className="font-medium" style={{ color: "#FF6B00" }}>${itemValue}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP: Select locker */}
        {step === "locker" && (
          <div>
            <button onClick={() => setStep("select")} className="text-sm text-gray-400 hover:text-white transition-colors mb-4">← Back</button>
            <h1 className="text-3xl font-bold mb-2 text-white">Choose a Parcel Locker</h1>
            <p className="text-sm text-gray-400 mb-6">Select a 24/7 locker near you to drop off your item.</p>

            {/* Live AusPost suburb/postcode search */}
            <div className="relative mb-6">
              <label className="block text-sm text-gray-400 mb-2">Search your suburb or postcode</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={suburbQuery}
                  onChange={(e) => setSuburbQuery(e.target.value)}
                  placeholder="e.g. Greenacres or 5086"
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                />
                <button
                  onClick={fetchLockers}
                  className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all hover:scale-[1.02]"
                  style={{ background: "#FF6B00" }}
                >
                  Find lockers
                </button>
              </div>
              {/* Suburb dropdown results */}
              {suburbLoading && (
                <p className="text-xs text-gray-500 mt-2">Searching AusPost database...</p>
              )}
              {suburbResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-white/10 bg-[#0A0A0A] shadow-2xl max-h-60 overflow-y-auto">
                  {suburbResults.map((s, i) => (
                    <button
                      key={`${s.postcode}-${s.location}-${i}`}
                      onClick={() => handleSuburbSelect(s)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/[0.06] transition-colors border-b border-white/5 last:border-0"
                    >
                      <span className="font-medium">{s.location}</span>
                      <span className="text-gray-500 ml-2">{s.state} {s.postcode}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedSuburb && (
                <p className="text-xs mt-2" style={{ color: "#00A87E" }}>
                  ✓ {selectedSuburb.location}, {selectedSuburb.state} {selectedSuburb.postcode}
                </p>
              )}
            </div>

            {loading && <p className="text-sm text-gray-400">Finding lockers near you...</p>}

            {/* Locker map */}
            {lockers.length > 0 && (
              <div className="mb-4">
                <LockerMap
                  lockers={lockers as any}
                  selectedLocker={selectedLocker}
                  onSelectLocker={(l: any) => setSelectedLocker(l)}
                />
              </div>
            )}

            <div className="space-y-3">
              {lockers.map((locker) => (
                <button
                  key={locker.id}
                  onClick={() => { setSelectedLocker(locker); setStep("confirm"); }}
                  className="w-full text-left rounded-xl p-5 border border-white/10 hover:border-[#FF6B00] transition-all bg-white/[0.03] hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold mb-1 text-white">{locker.name}</h3>
                      <p className="text-sm text-gray-400">{locker.address}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
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
            <button onClick={() => setStep(deliveryOption === "locker" ? "locker" : "select")} className="text-sm text-gray-400 hover:text-white transition-colors mb-4">← Back</button>
            <h1 className="text-3xl font-bold mb-2 text-white">Confirm your shipment</h1>
            <p className="text-sm text-gray-400 mb-8">Review the details below and generate your shipping label.</p>

            <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/10 space-y-4">
              {/* Delivery method */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-sm text-gray-400">Delivery method</span>
                <span className="text-sm font-semibold text-gray-100">
                  {deliveryOption === "locker" ? "📦 Parcel Locker" : "🏠 Home Pickup"}
                </span>
              </div>

              {/* Locker details */}
              {deliveryOption === "locker" && selectedLocker && (
                <div className="pb-4 border-b border-white/10">
                  <span className="text-sm text-gray-400">Locker location</span>
                  <p className="text-sm font-semibold mt-1 text-gray-100">{selectedLocker.name}</p>
                  <p className="text-sm text-gray-400">{selectedLocker.address}</p>
                </div>
              )}

              {/* Home pickup address */}
              {deliveryOption === "home" && (
                <div className="pb-4 border-b border-white/10">
                  <AddressAutocomplete
                    label="Pickup address"
                    placeholder="Start typing your address..."
                    value={pickupAddress}
                    onChange={(val) => setPickupAddress(val)}
                    required
                  />
                  {/* Suburb search for home pickup (needed for postage calc) */}
                  {!selectedSuburb && (
                    <div className="mt-4">
                      <label className="block text-sm text-gray-400 mb-2">Confirm your suburb for shipping costs</label>
                      <input
                        type="text"
                        value={suburbQuery}
                        onChange={(e) => setSuburbQuery(e.target.value)}
                        placeholder="e.g. Greenacres or 5086"
                        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                      />
                      {suburbResults.length > 0 && (
                        <div className="mt-1 rounded-lg border border-white/10 bg-[#0A0A0A] max-h-48 overflow-y-auto">
                          {suburbResults.map((s, i) => (
                            <button
                              key={`${s.postcode}-${s.location}-${i}`}
                              onClick={() => handleSuburbSelect(s)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/[0.06] transition-colors border-b border-white/5 last:border-0"
                            >
                              <span className="font-medium">{s.location}</span>
                              <span className="text-gray-500 ml-2">{s.state} {s.postcode}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedSuburb && (
                    <p className="text-xs mt-2" style={{ color: "#00A87E" }}>
                      ✓ {selectedSuburb.location}, {selectedSuburb.state} {selectedSuburb.postcode}
                    </p>
                  )}
                </div>
              )}

              {/* Live postage calculation */}
              {selectedSuburb && (
                <div className="pb-4 border-b border-white/10">
                  <span className="text-sm text-gray-400">Shipping service</span>
                  {/* Service selector */}
                  {postageServices.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {postageServices
                        .filter((s) => s.code === "AUS_PARCEL_EXPRESS" || s.code === "AUS_PARCEL_REGULAR")
                        .map((s) => (
                          <button
                            key={s.code}
                            onClick={() => setSelectedService(s.code)}
                            className={`w-full text-left rounded-lg p-3 border transition-all ${
                              selectedService === s.code
                                ? "border-[#FF6B00] bg-[#FF6B00]/[0.08]"
                                : "border-white/10 bg-white/[0.02] hover:border-white/20"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-sm font-medium text-gray-100">{s.name}</span>
                                {s.code === "AUS_PARCEL_EXPRESS" && (
                                  <span className="text-xs text-gray-500 ml-2">Next business day</span>
                                )}
                                {s.code === "AUS_PARCEL_REGULAR" && (
                                  <span className="text-xs text-gray-500 ml-2">2-3 business days</span>
                                )}
                              </div>
                              <span className="text-sm text-gray-400">from ${s.price}</span>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Cost breakdown */}
                  {postageLoading && (
                    <p className="text-xs text-gray-500 mt-2">Calculating live postage...</p>
                  )}
                  {postageResult && !postageLoading && (
                    <div className="mt-3 rounded-lg p-4 bg-white/[0.02] border border-white/5">
                      <div className="space-y-1.5">
                        {getCostBreakdown(postageResult).map((c, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-400">{c.item}</span>
                            <span className="text-gray-200">${c.cost}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                          <span className="font-semibold text-gray-200">Total shipping</span>
                          <span className="font-bold" style={{ color: "#FF6B00" }}>${postageResult.total_cost}</span>
                        </div>
                        <div className="flex justify-between text-xs pt-1">
                          <span className="text-gray-500">{postageResult.delivery_time}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Insurance */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                  <span className="text-sm text-gray-400">Transit insurance</span>
                  <p className="text-xs text-gray-500">Extra Cover up to ${Math.min(itemValue, 5000)}</p>
                </div>
                <span className="text-sm font-semibold" style={{ color: "#00A87E" }}>✓ Included</span>
              </div>

              {/* Tracking */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Tracking</span>
                <span className="text-sm font-semibold text-gray-100">AusPost tracking + SMS updates</span>
              </div>
            </div>

            {/* Cost summary */}
            {shippingCost !== null && (
              <div className="mt-4 rounded-xl p-4 bg-white/[0.03] border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Shipping cost (paid by PawnPass)</span>
                  <span className="text-lg font-bold text-white">${shippingCost.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">No charge to you — shipping is complimentary for all pawn loans.</p>
              </div>
            )}

            <button
              onClick={createShipment}
              disabled={loading || (deliveryOption === "home" && !pickupAddress)}
              className="w-full mt-6 rounded-full py-4 text-base font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
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
            <h1 className="text-3xl font-bold mb-2 text-white">Your label is ready!</h1>
            <p className="text-sm text-gray-400 mb-8">
              {deliveryOption === "locker"
                ? "Take your item to the locker. Scan the QR code or show the label. You'll get an SMS when we receive it."
                : "We'll SMS you a pickup time window. Have your item ready for the courier."}
            </p>

            {/* QR code — dark card container with white QR code area */}
            <div className="rounded-2xl p-8 bg-white/[0.03] border border-white/10 mb-6">
              <div className="w-48 h-48 mx-auto rounded-lg flex items-center justify-center text-gray-400 mb-4"
                style={{ background: "repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #e0e0e0 10px, #e0e0e0 20px)" }}>
                <span className="text-sm font-mono">QR CODE</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Tracking #</span><span className="font-mono font-medium text-gray-100">{shipment.tracking_number}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Shipment ID</span><span className="font-mono text-gray-100">{shipment.shipment_id}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Insurance</span><span className="font-medium" style={{ color: "#00A87E" }}>Covered to ${itemValue}</span></div>
                {shippingCost !== null && (
                  <div className="flex justify-between"><span className="text-gray-400">Shipping service</span><span className="font-medium text-gray-100">{postageResult?.service || "Express Post"}</span></div>
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <a href="/dashboard" className="rounded-full px-8 py-3 text-sm font-medium text-white transition-all hover:scale-[1.02]" style={{ background: "#FF6B00" }}>
                View my dashboard →
              </a>
              <button className="rounded-full px-8 py-3 text-sm font-medium text-gray-200 border-2 border-white/15 transition-all hover:scale-[1.02] hover:border-white/30">
                Download label
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
