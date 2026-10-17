"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LogoHeader from "@/components/LogoHeader";

function CounterOfferContent() {
  const params = useSearchParams();
  const loanId = params.get("loan");
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"idle" | "accepting" | "declining" | "done">("idle");
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    if (!loanId) return;
    // Fetch loan details
    fetch(`/api/loans?action=get_loan&loanId=${loanId}`)
      .then((res) => res.json())
      .then((data) => {
        setLoan(data.loan || data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [loanId]);

  async function respond(accept: boolean) {
    if (!loanId) return;
    setAction(accept ? "accepting" : "declining");
    try {
      const res = await fetch("/api/admin/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: accept ? "accept_counter" : "decline_counter",
          loanId,
        }),
      });
      const data = await res.json();
      setResult(data);
      setAction("done");
    } catch {
      setResult({ status: "error", message: "Something went wrong" });
      setAction("done");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <LogoHeader backLink="/dashboard" backLabel="← Dashboard" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <p className="text-gray-400 text-sm">Counter-offer not found.</p>
      </div>
    );
  }

  if (action === "done" && result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
        <div className="max-w-md w-full rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {result.status === "active" ? (
            <>
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-xl font-bold text-white mb-2">Counter-offer accepted</h1>
              <p className="text-sm text-gray-400">{result.message}</p>
            </>
          ) : result.status === "returned" ? (
            <>
              <div className="text-4xl mb-4">📦</div>
              <h1 className="text-xl font-bold text-white mb-2">Counter-offer declined</h1>
              <p className="text-sm text-gray-400">{result.message}</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
              <p className="text-sm text-gray-400">{result.message}</p>
            </>
          )}
          <a href="/dashboard" className="mt-6 block text-center text-sm" style={{ color: "#FF6B00" }}>
            Back to dashboard →
          </a>
        </div>
      </div>
    );
  }

  const originalAmount = loan.principal;
  const counterAmount = loan.counterOfferAmount;
  const reason = loan.counterOfferReason;
  const isIncrease = counterAmount > originalAmount;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "#0A0A0A" }}>
      <div className="max-w-lg w-full">
        <h1 className="text-2xl font-bold text-white mb-2">Revised offer for your item</h1>
        <p className="text-sm text-gray-400 mb-8">
          After inspecting your item, we've revised our offer. You have 48 hours to respond.
        </p>

        <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
            <div>
              <p className="text-xs text-gray-500 mb-1">ORIGINAL OFFER</p>
              <p className="text-2xl font-bold text-gray-400">${originalAmount}</p>
            </div>
            <div className="text-2xl">→</div>
            <div>
              <p className="text-xs text-gray-500 mb-1">REVISED OFFER</p>
              <p className="text-2xl font-bold" style={{ color: isIncrease ? "#00A87E" : "#FF6B00" }}>
                ${counterAmount}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">ITEM</p>
            <p className="text-sm text-gray-300">{loan.itemDescription}</p>
          </div>

          {reason && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">REASON FOR CHANGE</p>
              <p className="text-sm text-gray-300">{reason}</p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">LOAN ID</p>
            <p className="text-sm text-gray-400 font-mono">{loan.loanId}</p>
          </div>

          {loan.counterOfferExpiresAt && (
            <div>
              <p className="text-xs text-gray-500 mb-1">EXPIRES</p>
              <p className="text-sm text-gray-400">
                {new Date(loan.counterOfferExpiresAt).toLocaleString("en-AU", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => respond(true)}
            disabled={action !== "idle"}
            className="flex-1 rounded-xl py-4 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: "#FF6B00" }}
          >
            {action === "accepting" ? "Accepting..." : `Accept $${counterAmount} →`}
          </button>
          <button
            onClick={() => respond(false)}
            disabled={action !== "idle"}
            className="flex-1 rounded-xl py-4 text-sm font-semibold text-gray-300 transition-all hover:scale-[1.02] border border-white/10"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {action === "declining" ? "Declining..." : "Decline & return item"}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          If you decline, we'll send your item back at no cost. No impact on your credit file.
        </p>
      </div>
    </div>
  );
}


export default function CounterOfferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}><p className="text-gray-400 text-sm">Loading...</p></div>}>
      <CounterOfferContent />
    </Suspense>
  );
}
