"use client";

import { useState, useEffect, useCallback } from "react";
import { logout } from "@/app/actions/auth";

interface DBLoan {
  id: string;
  loanId: string;
  itemDescription: string;
  principal: number;
  interestRate: string;
  isGold: boolean | null;
  status: string;
  trackingNumber: string | null;
  totalInterestPaid: string | null;
  interestPaidThrough: string | null;
  dueDate: string;
  redeemedAt: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [loans, setLoans] = useState<DBLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<DBLoan | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLoans = useCallback(async () => {
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_loans" }),
      });
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans || []);
      }
    } catch (err) {
      console.error("Failed to fetch loans:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  async function payInterest() {
    if (!selectedLoan || !payAmount) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay_interest",
          loanId: selectedLoan.loanId,
          amount: parseFloat(payAmount),
        }),
      });
      if (res.ok) {
        await fetchLoans();
        setShowPayModal(false);
        setPayAmount("");
      }
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setActionLoading(false);
    }
  }

  async function redeemLoan(loanId: string) {
    if (!confirm("Redeem this loan? Your item will be shipped to your selected locker within 24 hours.")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem_loan", loanId }),
      });
      if (res.ok) {
        await fetchLoans();
      }
    } catch (err) {
      console.error("Redeem failed:", err);
    } finally {
      setActionLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    pending_verification: "#FF9500",
    active: "#00A87E",
    redeemed: "#6366F1",
    overdue: "#EF4444",
  };

  const statusLabels: Record<string, string> = {
    pending_verification: "Awaiting Item",
    active: "Active",
    redeemed: "Redeemed",
    overdue: "Overdue",
  };

  const activeLoans = loans.filter(l => l.status === "active" || l.status === "pending_verification");
  const totalBorrowed = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalInterest = loans.reduce((sum, l) => sum + parseFloat(l.totalInterestPaid || "0"), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-6 md:px-12 lg:px-20 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "#FF6B00" }}>P</div>
            <span className="text-xl font-bold tracking-tight">PawnPass</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/quote" className="rounded-full px-5 py-2 text-sm font-medium text-white" style={{ background: "#FF6B00" }}>New quote</a>
            <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-gray-900">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your loans, payments, and shipments</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl p-5 bg-white border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Active loans</p>
            <p className="text-2xl font-bold">{activeLoans.length}</p>
          </div>
          <div className="rounded-2xl p-5 bg-white border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total borrowed</p>
            <p className="text-2xl font-bold">${totalBorrowed.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl p-5 bg-white border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Interest paid</p>
            <p className="text-2xl font-bold">${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Loan list */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading your loans…</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="rounded-2xl p-12 bg-white border border-gray-200 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-semibold mb-2">No loans yet</h2>
            <p className="text-gray-500 text-sm mb-6">Get a quote and ship your item to start your first pawn loan.</p>
            <div className="flex gap-3 justify-center">
              <a href="/quote" className="rounded-full px-6 py-3 text-sm font-medium text-white" style={{ background: "#FF6B00" }}>Get a quote</a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div key={loan.id} className="rounded-2xl p-6 bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ background: statusColors[loan.status] || "#999" }}>
                        {statusLabels[loan.status] || loan.status}
                      </span>
                      {loan.isGold && <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: "#FFF8E1", color: "#B09000" }}>Gold rate</span>}
                    </div>
                    <h3 className="font-semibold text-lg">{loan.itemDescription}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{loan.loanId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: "#FF6B00" }}>${loan.principal}</p>
                    <p className="text-xs text-gray-500">{loan.interestRate}/month</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Created</p>
                    <p className="font-medium">{new Date(loan.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Due date</p>
                    <p className="font-medium">{new Date(loan.dueDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Tracking</p>
                    <p className="font-mono text-xs">{loan.trackingNumber || "—"}</p>
                  </div>
                </div>

                {/* Actions */}
                {(loan.status === "active" || loan.status === "pending_verification") && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => { setSelectedLoan(loan); setShowPayModal(true); }}
                      disabled={actionLoading}
                      className="rounded-full px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                      style={{ background: "#FF6B00" }}
                    >
                      Pay interest
                    </button>
                    <button
                      onClick={() => redeemLoan(loan.loanId)}
                      disabled={actionLoading}
                      className="rounded-full px-5 py-2.5 text-sm font-medium border-2 border-gray-300 disabled:opacity-40"
                    >
                      Redeem item
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact support */}
        <div className="mt-12 rounded-2xl p-6 text-center" style={{ background: "#0A0A0A" }}>
          <h3 className="text-white font-semibold mb-1">Need help?</h3>
          <p className="text-gray-400 text-sm mb-4">Our AI chatbot can answer most questions. For complex issues, email us.</p>
          <div className="flex gap-4 justify-center">
            <button className="rounded-full px-6 py-2.5 text-sm font-medium text-white" style={{ background: "#FF6B00" }}>💬 Chat with us</button>
            <a href="mailto:info@pawnpass.com.au" className="rounded-full px-6 py-2.5 text-sm font-medium text-white border-2 border-gray-600">
              Email support
            </a>
          </div>
        </div>
      </div>

      {/* Pay interest modal */}
      {showPayModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowPayModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Pay interest</h2>
            <p className="text-sm text-gray-500 mb-4">Loan: {selectedLoan.itemDescription}</p>

            <div className="rounded-xl p-4 bg-gray-50 mb-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Principal</span><span className="font-medium">${selectedLoan.principal}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monthly interest</span><span className="font-medium">${Math.round(selectedLoan.principal * parseFloat(selectedLoan.interestRate) / 100)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Interest paid to date</span><span className="font-medium">${parseFloat(selectedLoan.totalInterestPaid || "0").toFixed(2)}</span></div>
            </div>

            <label className="text-sm font-semibold text-gray-700 mb-2 block">Payment amount (AUD)</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={`${Math.round(selectedLoan.principal * parseFloat(selectedLoan.interestRate) / 100)}`}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-lg font-medium focus:outline-none focus:border-orange-500 mb-4"
            />
            <p className="text-xs text-gray-400 mb-6">Payment via Osko (instant bank transfer). Extends your loan by the corresponding months.</p>

            <div className="flex gap-3">
              <button onClick={payInterest} disabled={!payAmount || actionLoading} className="flex-1 rounded-full py-3 text-sm font-medium text-white disabled:opacity-40" style={{ background: "#FF6B00" }}>
                {actionLoading ? "Processing…" : `Pay $${payAmount || "0"}`}
              </button>
              <button onClick={() => setShowPayModal(false)} className="rounded-full px-6 py-3 text-sm font-medium border-2 border-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
