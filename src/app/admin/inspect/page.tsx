"use client";

import { useState, useEffect, useCallback } from "react";
import LogoHeader from "@/components/LogoHeader";

interface Loan {
  id: string;
  loanId: string;
  itemDescription: string;
  principal: number;
  interestRate: string;
  isGold: boolean | null;
  status: string;
  trackingNumber: string | null;
  notes: any[];
  payoutStatus?: string | null;
  counterOfferAmount?: number | null;
  counterOfferReason?: string | null;
  counterOfferStatus?: string | null;
  createdAt: string;
}

export default function HubInspectionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Inspection Checklist Form State
  const [conditionGrade, setConditionGrade] = useState("Good");
  const [serialNumber, setSerialNumber] = useState("");
  const [functionalityPassed, setFunctionalityPassed] = useState(true);
  const [goldKarat, setGoldKarat] = useState("9ct");
  const [goldWeightGrams, setGoldWeightGrams] = useState("");
  const [notes, setNotes] = useState("");

  // Counter-offer state
  const [counterAmount, setCounterAmount] = useState("");
  const [counterReason, setCounterReason] = useState("");
  const [showCounterModal, setShowCounterModal] = useState(false);

  const [accessDenied, setAccessDenied] = useState(false);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const res = await fetch("/api/admin/inspect");
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleAction = async (action: string, extraData: Record<string, any> = {}) => {
    if (!selectedLoan) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          loanId: selectedLoan.loanId,
          notes: `Inspection Checklist: Grade: ${conditionGrade}, S/N: ${serialNumber || "N/A"}, Func: ${functionalityPassed ? "PASS" : "FAIL"}${selectedLoan.isGold ? `, Gold: ${goldKarat} ${goldWeightGrams}g` : ""}. ${notes}`,
          ...extraData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setFeedback({ type: "success", msg: data.message || "Action processed successfully" });
      setShowCounterModal(false);
      setSelectedLoan(null);
      await fetchLoans();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "An error occurred" });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingInspection = loans.filter(
    (l) => l.status === "pending_verification" || l.status === "received" || l.status === "shipped"
  );

  const pendingPayoutApproval = loans.filter(
    (l) => l.status === "active" && l.payoutStatus === "pending"
  );

  const filtered = pendingInspection.filter(
    (l) =>
      !search ||
      l.loanId.toLowerCase().includes(search.toLowerCase()) ||
      l.itemDescription.toLowerCase().includes(search.toLowerCase()) ||
      (l.trackingNumber && l.trackingNumber.toLowerCase().includes(search.toLowerCase()))
  );

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.3)" }}>
          <div className="text-5xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-white mb-2">403 — Access Denied</h1>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            The Hub Physical Inspection Desk is restricted to 311 NE Road staff. Customer accounts cannot access internal inspection workflows.
          </p>
          <a
            href="/dashboard"
            className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: "#FF6B00" }}
          >
            ← Return to My Customer Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LogoHeader backLink="/admin" backLabel="← Admin Dashboard" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-white">Hub Physical Inspection Desk</h1>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono text-[#FF6B00]" style={{ background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.3)" }}>
                HUB: 311 NE ROAD HAMPSTEAD GARDENS
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Physical intake, grading checklist, counter-offers & two-person payout approval
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className="mb-6 rounded-xl p-4 text-sm font-medium"
            style={{
              background: feedback.type === "success" ? "rgba(0,168,126,0.15)" : "rgba(255,107,0,0.15)",
              border: feedback.type === "success" ? "1px solid rgba(0,168,126,0.3)" : "1px solid rgba(255,107,0,0.3)",
              color: feedback.type === "success" ? "#00A87E" : "#FF6B00",
            }}
          >
            {feedback.type === "success" ? "✓ " : "⚠ "} {feedback.msg}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <label className="block text-xs font-mono text-gray-400 mb-2">
            SCAN PARCEL LOCKER QR / TYPE TRACKING OR LOAN ID
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. PP-LOAN-1723123456 or 33PP001..."
            className="w-full rounded-xl border border-white/10 px-5 py-4 text-lg text-white bg-white/[0.03] placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Incoming Items Queue */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center justify-between">
              <span>Incoming Parcels for Inspection</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                {filtered.length}
              </span>
            </h2>

            {loading ? (
              <p className="text-sm text-gray-500 py-8 text-center">Loading queue...</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-sm text-gray-500">No items pending physical inspection</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedLoan(item);
                      if (item.isGold) {
                        setGoldKarat("9ct");
                      }
                    }}
                    className={`rounded-xl p-4 cursor-pointer transition-all ${
                      selectedLoan?.id === item.id
                        ? "border-[#FF6B00] bg-[#FF6B00]/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                    style={{ borderWidth: "1px", borderStyle: "solid" }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-gray-400">{item.loanId}</span>
                      <span
                        className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,149,0,0.2)", color: "#FF9500" }}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1 line-clamp-1">
                      {item.itemDescription}
                    </h3>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Quoted: ${item.principal}</span>
                      {item.trackingNumber && <span>Trk: {item.trackingNumber}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Two-Person Rule Payout Approval Queue */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h2 className="text-md font-semibold text-white mb-3 flex items-center justify-between">
                <span>🛡 Two-Person Payout Approvals</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#00A87E]">
                  {pendingPayoutApproval.length}
                </span>
              </h2>

              {pendingPayoutApproval.length === 0 ? (
                <p className="text-xs text-gray-500">No payouts awaiting second approval</p>
              ) : (
                <div className="space-y-2">
                  {pendingPayoutApproval.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl p-3 bg-white/[0.02] border border-emerald-500/30 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-xs font-mono text-gray-400">{p.loanId}</p>
                        <p className="text-xs text-white font-medium">{p.itemDescription}</p>
                        <p className="text-xs text-[#00A87E] font-bold">${p.principal} Osko</p>
                      </div>
                      <button
                        onClick={() => handleAction("approve_payout", { loanId: p.loanId })}
                        disabled={submitting}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white bg-[#00A87E] hover:scale-[1.02] transition-transform"
                      >
                        Approve Payout
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Inspection Workspace */}
          <div className="lg:col-span-2">
            {!selectedLoan ? (
              <div
                className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-2xl p-8 text-center"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-lg font-semibold text-white mb-1">Select an Item to Inspect</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Choose an incoming parcel from the queue on the left or scan its tracking barcode to open the physical verification checklist.
                </p>
              </div>
            ) : (
              <div
                className="rounded-2xl p-6 space-y-6"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-mono text-[#FF6B00] mb-1 block">
                      INSPECTION IN PROGRESS • {selectedLoan.loanId}
                    </span>
                    <h2 className="text-xl font-bold text-white">{selectedLoan.itemDescription}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Customer Quote Principal: <span className="text-white font-bold">${selectedLoan.principal}</span> ({selectedLoan.interestRate}/mo)
                    </p>
                  </div>
                  <button
                    onClick={() => handleAction("mark_received")}
                    disabled={submitting || selectedLoan.status === "received"}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/20 text-gray-300 hover:text-white"
                  >
                    {selectedLoan.status === "received" ? "✓ Received at Hub" : "Mark Received"}
                  </button>
                </div>

                {/* Physical Inspection Checklist */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider font-mono">
                    FIG.01 Physical Verification Checklist
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Visual Condition Grade</label>
                      <select
                        value={conditionGrade}
                        onChange={(e) => setConditionGrade(e.target.value)}
                        className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white bg-black focus:border-[#FF6B00] outline-none"
                      >
                        <option value="Mint">Mint / Brand New in Box</option>
                        <option value="Excellent">Excellent (Minor cosmetic wear)</option>
                        <option value="Good">Good (Normal wear & tear)</option>
                        <option value="Fair">Fair (Noticeable scratches/dents)</option>
                        <option value="Damaged">Damaged / Non-functional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Serial / IMEI Number</label>
                      <input
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="Scan or enter S/N..."
                        className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white bg-black focus:border-[#FF6B00] outline-none font-mono"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Functional Test Result</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setFunctionalityPassed(true)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                            functionalityPassed
                              ? "bg-[#00A87E]/20 border-[#00A87E] text-[#00A87E]"
                              : "border-white/10 text-gray-500"
                          }`}
                        >
                          ✓ Fully Functional
                        </button>
                        <button
                          type="button"
                          onClick={() => setFunctionalityPassed(false)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                            !functionalityPassed
                              ? "bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00]"
                              : "border-white/10 text-gray-500"
                          }`}
                        >
                          ⚠ Faulty / Issues Detected
                        </button>
                      </div>
                    </div>

                    {/* Gold specifics */}
                    {selectedLoan.isGold && (
                      <>
                        <div>
                          <label className="block text-xs text-emerald-400 mb-1">Gold Karat (XRF Verified)</label>
                          <select
                            value={goldKarat}
                            onChange={(e) => setGoldKarat(e.target.value)}
                            className="w-full rounded-xl border border-emerald-500/30 px-4 py-2.5 text-sm text-white bg-black outline-none"
                          >
                            <option value="9ct">9ct (37.5% AU)</option>
                            <option value="10ct">10ct (41.7% AU)</option>
                            <option value="14ct">14ct (58.5% AU)</option>
                            <option value="18ct">18ct (75.0% AU)</option>
                            <option value="22ct">22ct (91.6% AU)</option>
                            <option value="24ct">24ct Bullion (99.9% AU)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-emerald-400 mb-1">Precious Weight (Grams)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={goldWeightGrams}
                            onChange={(e) => setGoldWeightGrams(e.target.value)}
                            placeholder="e.g. 18.5"
                            className="w-full rounded-xl border border-emerald-500/30 px-4 py-2.5 text-sm text-white bg-black outline-none font-mono"
                          />
                        </div>
                      </>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Inspector Notes / Observations</label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Detail any scratches, missing accessories, or testing remarks..."
                        className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white bg-black focus:border-[#FF6B00] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Inspection Decision Buttons */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4">
                  <button
                    onClick={() => handleAction("confirm_quote")}
                    disabled={submitting}
                    className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.01]"
                    style={{ background: "#00A87E" }}
                  >
                    ✓ Confirm Match — Activate Loan (${selectedLoan.principal})
                  </button>

                  <button
                    onClick={() => setShowCounterModal(true)}
                    disabled={submitting}
                    className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.01]"
                    style={{ background: "#FF6B00" }}
                  >
                    ⚡ Issue Counter-Offer
                  </button>

                  <button
                    onClick={() => handleAction("decline_counter")}
                    disabled={submitting}
                    className="px-5 py-3.5 rounded-xl font-semibold text-sm text-gray-300 border border-white/10 hover:border-white/20 transition-all"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    📦 Reject & Generate Return Label
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Counter-Offer Modal */}
        {showCounterModal && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div
              className="max-w-md w-full rounded-2xl p-6 space-y-4"
              style={{ background: "#0A0A0A", border: "1px solid rgba(255,107,0,0.4)" }}
            >
              <h3 className="text-xl font-bold text-white">Generate Counter-Offer</h3>
              <p className="text-xs text-gray-400">
                Original Quote: <span className="text-white font-bold">${selectedLoan.principal}</span>. Specify the revised amount and reason below.
              </p>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Revised Loan Amount ($)</label>
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-lg font-bold text-white bg-black focus:border-[#FF6B00] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Reason for Adjustment</label>
                <textarea
                  rows={3}
                  value={counterReason}
                  onChange={(e) => setCounterReason(e.target.value)}
                  placeholder="e.g. Screen scratch detected; weight 18.2g vs declared 20g"
                  className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white bg-black focus:border-[#FF6B00] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    handleAction("counter_offer", {
                      counterAmount: parseFloat(counterAmount),
                      counterReason,
                    })
                  }
                  disabled={submitting || !counterAmount}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#FF6B00] hover:scale-[1.02] transition-transform"
                >
                  Send Offer Link (48h Expiry)
                </button>
                <button
                  onClick={() => setShowCounterModal(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}