"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LogoHeader from "@/components/LogoHeader";

function SignContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const type = params.get("type") || "pawn";
  const loanId = params.get("loan");

  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedAt, setSignedAt] = useState("");

  useEffect(() => {
    if (!token || !loanId) {
      setError("Invalid link — missing token or loan ID.");
      setLoading(false);
      return;
    }

    fetch(`/api/contracts/create-signing-link?token=${token}&loan=${loanId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.expired) {
          setExpired(true);
        } else if (data.signed) {
          setAlreadySigned(true);
        } else if (data.error) {
          setError(data.error);
        } else if (data.valid) {
          setLoan(data);
          setCustomerName(data.customerName || "");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to verify signing link.");
        setLoading(false);
      });
  }, [token, loanId]);

  async function handleSign() {
    if (!customerName.trim() || !agreed) return;
    setSigning(true);
    try {
      const res = await fetch("/api/contracts/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, loanId, customerName, agreed }),
      });
      const data = await res.json();
      if (res.ok) {
        setSigned(true);
        setSignedAt(data.signedAt);
      } else {
        setError(data.error || "Signing failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSigning(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <p className="text-gray-400 text-sm">Verifying your signing link...</p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-white mb-2">Link expired</h1>
          <p className="text-sm text-gray-400 mb-6">This signing link has expired. Please request a new one from PawnPass.</p>
          <a href="/" className="text-sm" style={{ color: "#FF6B00" }}>← Back to PawnPass</a>
        </div>
      </div>
    );
  }

  if (alreadySigned || signed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-white mb-2">Contract signed</h1>
          <p className="text-sm text-gray-400 mb-2">
            {type === "pawn" ? "Pawn Loan Agreement" : "Buy Outright Agreement"} signed successfully.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Signed by {customerName} at {new Date(signedAt || Date.now()).toLocaleString("en-AU")}
          </p>
          <p className="text-sm text-gray-400 mb-6">Loan ID: {loanId}</p>
          <a href="/dashboard" className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: "#FF6B00" }}>
            Go to dashboard →
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <a href="/" className="text-sm" style={{ color: "#FF6B00" }}>← Back to PawnPass</a>
        </div>
      </div>
    );
  }

  const contractTitle = type === "pawn" ? "Pawn Loan Agreement" : "Buy Outright Agreement";

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LogoHeader backLink="/dashboard" backLabel="← Dashboard" />
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo-icon-v3.svg" alt="PawnPass" className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold text-white">{contractTitle}</h1>
            <p className="text-xs text-gray-500">Under the Second-hand Dealers and Pawnbrokers Act 1996 (SA)</p>
          </div>
        </div>

        {/* Loan details card */}
        {loan && (
          <div className="rounded-2xl p-6 mb-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 className="text-sm font-semibold text-gray-400 mb-4">CONTRACT DETAILS</h2>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-white/5"><td className="py-3 text-gray-400">Loan ID</td><td className="py-3 text-white font-mono">{loan.loanId}</td></tr>
                <tr className="border-b border-white/5"><td className="py-3 text-gray-400">Item</td><td className="py-3 text-white">{loan.itemDescription}</td></tr>
                <tr className="border-b border-white/5"><td className="py-3 text-gray-400">Amount</td><td className="py-3 text-white font-medium">${loan.principal}</td></tr>
                <tr className="border-b border-white/5"><td className="py-3 text-gray-400">Interest rate</td><td className="py-3 text-white">{loan.interestRate}/month</td></tr>
                {loan.dueDate && <tr className="border-b border-white/5"><td className="py-3 text-gray-400">Redemption due</td><td className="py-3 text-white">{new Date(loan.dueDate).toLocaleDateString("en-AU")}</td></tr>}
                <tr><td className="py-3 text-gray-400">Link expires</td><td className="py-3 text-white">{new Date(loan.expiresAt).toLocaleString("en-AU")}</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Contract terms summary */}
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed mb-8">
          <div className="rounded-lg p-4 border border-[#FF6B00]/20" style={{ background: "rgba(255,107,0,0.05)" }}>
            <p className="text-xs text-gray-400">
              {type === "pawn" ? (
                <>By signing, you agree to pawn your item as collateral for the loan. Interest is charged monthly. You may redeem your item by paying the principal plus interest. If not redeemed, the item will be sold and any residual equity returned to you.</>
              ) : (
                <>By signing, you agree to sell your item to PawnPass outright. Title transfers upon payment. There is no right of redemption.</>
              )}
            </p>
          </div>

          {/* Full terms link */}
          <p className="text-xs text-gray-500">
            <a href={`/legal/${type === "pawn" ? "pawn-loan-agreement" : "buy-outright-agreement"}`} target="_blank" style={{ color: "#FF6B00" }}>
              Read the full {contractTitle} →
            </a>
          </p>
        </div>

        {/* Signature area */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 className="text-lg font-semibold text-white mb-4">Digital signature</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full legal name (as on your ID)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Type your full legal name"
                className="w-full rounded-lg border border-white/10 px-4 py-3 text-base text-gray-100 bg-white/[0.03] placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">By typing your name, you are electronically signing this contract.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 accent-[#FF6B00]"
              />
              <span className="text-sm text-gray-300 leading-relaxed">
                I confirm that I am 18 years of age or older, I am the legal owner of the item, the item is not stolen, and I agree to the terms of the {contractTitle} and the Second-hand Dealers and Pawnbrokers Act 1996 (SA).
              </span>
            </label>

            <button
              onClick={handleSign}
              disabled={!customerName.trim() || !agreed || signing}
              className="w-full rounded-full py-3.5 text-base font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.01]"
              style={{ background: "#FF6B00", boxShadow: "0 0 20px rgba(255,107,0,0.3)" }}
            >
              {signing ? "Signing..." : `Sign ${contractTitle} →`}
            </button>

            <p className="text-center text-xs text-gray-500">
              Your signature will be recorded with timestamp, IP address, and device info for legal records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}><p className="text-gray-400 text-sm">Loading...</p></div>}>
      <SignContent />
    </Suspense>
  );
}