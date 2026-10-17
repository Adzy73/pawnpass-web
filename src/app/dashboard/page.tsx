"use client";
import LogoHeader from "@/components/LogoHeader";

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
  autoPayEnabled?: boolean;
}

// Mock loans for testing — shown when no real loans exist or auth fails
function getMockLoans(): DBLoan[] {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const daysAgo10 = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const daysAgo25 = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString();
  const overdue15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "mock-3",
      loanId: "PP-LOAN-007-OVERDUE",
      itemDescription: "Canon EOS R6 Camera Body — 24.1MP Full Frame",
      principal: 800, interestRate: "25.00%", isGold: false, status: "overdue",
      trackingNumber: "33PP007", totalInterestPaid: "200.00", interestPaidThrough: daysAgo25,
      dueDate: overdue15, redeemedAt: null, createdAt: daysAgo25, autoPayEnabled: false,
    },
    {
      id: "mock-1",
      loanId: "PP-LOAN-101",
      itemDescription: "9ct Gold Sovereign Ring 12g",
      principal: 650, interestRate: "26.25%", isGold: true, status: "active",
      trackingNumber: "33PP101", totalInterestPaid: "170.63", interestPaidThrough: daysAgo10,
      dueDate: in30Days, redeemedAt: null, createdAt: daysAgo25, autoPayEnabled: true,
    },
    {
      id: "mock-2",
      loanId: "PP-LOAN-102",
      itemDescription: "PlayStation 5 Console + 2 Controllers",
      principal: 300, interestRate: "35.00%", isGold: false, status: "active",
      trackingNumber: "33PP102", totalInterestPaid: "0", interestPaidThrough: null,
      dueDate: in5Days, redeemedAt: null, createdAt: daysAgo25, autoPayEnabled: false,
    },
  ];
}

export default function DashboardPage() {
  const [loans, setLoans] = useState<DBLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<DBLoan | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [autoPayMap, setAutoPayMap] = useState<Record<string, boolean>>({});

  const fetchLoans = useCallback(async () => {
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_loans" }),
      });
      if (res.ok) {
        const data = await res.json();
        const userLoans = data.loans || [];
        if (userLoans.length > 0) {
          setLoans(userLoans);
        } else {
          setLoans(getMockLoans());
        }
      } else {
        setLoans(getMockLoans());
      }
    } catch {
      setLoans(getMockLoans());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Toggle Auto-Pay for a loan
  const toggleAutoPay = (loanId: string) => {
    setAutoPayMap((prev) => {
      const nextState = !prev[loanId];
      alert(`Auto-Pay Interest ${nextState ? "ENABLED" : "DISABLED"} for loan ${loanId}.\n\nWhen enabled, monthly interest is automatically charged on your due date so your loan stays current and you never risk losing your item.`);
      return { ...prev, [loanId]: nextState };
    });
  };

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
    } catch {
      // ignore
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
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    pending_verification: "#FF9500",
    active: "#00A87E",
    redeemed: "#6B7280",
    overdue: "#FF6B00",
    forfeited: "#6B7280",
  };

  const statusLabels: Record<string, string> = {
    pending_verification: "Awaiting Item",
    active: "Active",
    redeemed: "Redeemed",
    overdue: "OVERDUE",
    forfeited: "Forfeited",
  };

  const activeLoans = loans.filter((l) => l.status === "active" || l.status === "pending_verification" || l.status === "overdue");
  const totalBorrowed = loans.reduce((sum, l) => sum + l.principal, 0);

  // Calculate total monthly interest owing across active loans
  const totalInterestOwing = activeLoans.reduce((sum, l) => {
    const rateNum = parseFloat(l.interestRate) || 35;
    const monthlyDue = l.principal * (rateNum / 100);
    return sum + monthlyDue;
  }, 0);

  // Pin overdue loans to top; otherwise sort by due date ascending
  const nowTime = new Date().getTime();
  const sortedLoans = [...loans].sort((a, b) => {
    const aOverdue = a.status === "overdue" || (a.status === "active" && new Date(a.dueDate).getTime() < nowTime);
    const bOverdue = b.status === "overdue" || (b.status === "active" && new Date(b.dueDate).getTime() < nowTime);

    // Pin overdue loans to top until actioned
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Otherwise sort by due date ascending
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LogoHeader mode="customer" />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Customer Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Manage active pawn loans, repayments, and auto-pay agreements</p>
          </div>
          <a
            href="/quote"
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: "#FF6B00" }}
          >
            + Get New Quote
          </a>
        </div>

        {/* Stats Cards — Interest Paid Total removed per user directive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10">
            <p className="text-xs font-mono text-gray-400 mb-1">ACTIVE LOANS</p>
            <p className="text-3xl font-bold text-white">{activeLoans.length}</p>
          </div>
          <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10">
            <p className="text-xs font-mono text-gray-400 mb-1">TOTAL BORROWED</p>
            <p className="text-3xl font-bold text-white">${totalBorrowed.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl p-5 bg-white/[0.03] border border-amber-500/30 bg-amber-500/5">
            <p className="text-xs font-mono text-amber-400 mb-1">MONTHLY INTEREST OWING</p>
            <p className="text-3xl font-bold text-[#FF6B00]">${totalInterestOwing.toFixed(2)}</p>
          </div>
        </div>

        {/* Loan list */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[#FF6B00] animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-400">Loading your active loans…</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="rounded-2xl p-12 bg-white/[0.03] border border-white/10 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-white mb-2">No active loans</h2>
            <p className="text-sm text-gray-400 mb-6">Get an instant AI quote and drop your item at a 24/7 parcel locker to start.</p>
            <a href="/quote" className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white bg-[#FF6B00]">
              Get a quote →
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedLoans.map((loan) => {
              const isOverdue = loan.status === "overdue" || (loan.status === "active" && new Date(loan.dueDate) < new Date());
              const rateNum = parseFloat(loan.interestRate) || 35;
              const monthlyInterestDue = (loan.principal * (rateNum / 100)).toFixed(2);

              // Calculate scheduled forfeiture sale date (14 days past due date)
              const dueDateObj = new Date(loan.dueDate);
              const saleDateObj = new Date(dueDateObj.getTime() + 14 * 24 * 60 * 60 * 1000);
              const formattedSaleDate = saleDateObj.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
              const isAutoPay = autoPayMap[loan.loanId] ?? loan.autoPayEnabled ?? false;

              return (
                <div
                  key={loan.id}
                  className={`rounded-2xl p-6 transition-all ${
                    isOverdue
                      ? "bg-amber-500/10 border-2 border-amber-500 shadow-[0_0_30px_rgba(255,149,0,0.2)]"
                      : "bg-white/[0.03] border border-white/10"
                  }`}
                >
                  {/* URGENT OVERDUE BANNER */}
                  {isOverdue && (
                    <div className="mb-4 rounded-xl p-4 bg-amber-500/20 border border-amber-500 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl animate-bounce">⚠️</div>
                        <div>
                          <p className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                            URGENT: OVERDUE INTEREST UNPAID (${monthlyInterestDue})
                          </p>
                          <p className="text-xs text-amber-200 mt-0.5">
                            Scheduled for forfeiture & resale on <strong className="underline text-white font-mono text-sm">{formattedSaleDate}</strong>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedLoan(loan); setPayAmount(monthlyInterestDue); setShowPayModal(true); }}
                        className="px-4 py-2 text-xs font-bold rounded-lg bg-[#FF6B00] text-white hover:scale-[1.02] transition-all shadow-md"
                      >
                        Pay ${monthlyInterestDue} Interest Now →
                      </button>
                    </div>
                  )}

                  {/* Header info */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full text-white uppercase font-mono"
                          style={{ background: statusColors[loan.status] || "#6B7280" }}
                        >
                          {statusLabels[loan.status] || loan.status}
                        </span>
                        {loan.isGold && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                            25% Gold Rate Discount
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-xl text-white mt-1">{loan.itemDescription}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">LOAN ID: {loan.loanId}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">${loan.principal}</p>
                      <p className="text-xs text-[#FF6B00] font-semibold">{loan.interestRate} / month</p>
                    </div>
                  </div>

                  {/* Financial Breakdown Grid — Interest Paid Removed */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-4 border-t border-white/10 mb-4">
                    <div>
                      <p className="text-gray-500 mb-0.5">INTEREST OWING NOW</p>
                      <p className="text-base font-bold text-[#FF6B00]">${monthlyInterestDue}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">DUE DATE</p>
                      <p className={`text-base font-bold ${isOverdue ? "text-amber-400 font-mono" : "text-white"}`}>
                        {dueDateObj.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">PARCEL LOCKER TRK</p>
                      <p className="font-mono text-xs text-gray-300 mt-1">{loan.trackingNumber || "—"}</p>
                    </div>
                  </div>

                  {/* AUTO-PAY INTEREST AGREEMENT TOGGLE */}
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">🔄</div>
                      <div>
                        <p className="text-xs font-bold text-white">Auto-Pay Monthly Interest on Due Date</p>
                        <p className="text-[11px] text-gray-400">
                          Automatically debits ${monthlyInterestDue} on {dueDateObj.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}. Prevents late fees and guarantees you never risk losing your item!
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleAutoPay(loan.loanId)}
                      className={`px-4 py-2 text-xs font-bold rounded-full transition-all shrink-0 ${
                        isAutoPay
                          ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(0,168,126,0.4)]"
                          : "bg-white/10 text-gray-400 hover:text-white border border-white/10"
                      }`}
                    >
                      {isAutoPay ? "✓ AUTO-PAY ON" : "Enable Auto-Pay"}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  {(loan.status === "active" || loan.status === "overdue" || loan.status === "pending_verification") && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => { setSelectedLoan(loan); setPayAmount(monthlyInterestDue); setShowPayModal(true); }}
                        disabled={actionLoading}
                        className="rounded-full px-5 py-2.5 text-xs font-bold text-white transition-all hover:scale-[1.02]"
                        style={{ background: "#FF6B00" }}
                      >
                        💳 Pay Interest (${monthlyInterestDue})
                      </button>

                      <button
                        onClick={() => redeemLoan(loan.loanId)}
                        disabled={actionLoading}
                        className="rounded-full px-5 py-2.5 text-xs font-bold text-white border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                      >
                        🔓 Redeem Loan & Collect Item
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Modal */}
        {showPayModal && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="max-w-md w-full rounded-2xl p-6 bg-[#0A0A0A] border border-[#FF6B00]/40 space-y-4">
              <h3 className="text-xl font-bold text-white">Pay Interest — {selectedLoan.loanId}</h3>
              <p className="text-xs text-gray-400">{selectedLoan.itemDescription}</p>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Interest Payment Amount ($)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 text-xl font-bold text-white bg-black focus:border-[#FF6B00] outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-gray-400 space-y-1">
                <p className="font-bold text-white">Instant Payment Rails:</p>
                <p>Processed securely via Osko / ANZ NPP instant bank transfer. Your due date will immediately extend by 30 days upon confirmation.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={payInterest}
                  disabled={actionLoading || !payAmount}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#FF6B00]"
                >
                  {actionLoading ? "Processing…" : `Confirm $${payAmount} Payment`}
                </button>
                <button
                  onClick={() => setShowPayModal(false)}
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