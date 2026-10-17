"use client";
import LogoHeader from "@/components/LogoHeader";
import { useState, useEffect, useCallback } from "react";

// ── Types ──
interface LoanNote {
  text: string;
  userId?: string;
  createdAt: string;
}

interface AdminLoan {
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
  notes: LoanNote[];
  counterOfferAmount?: number | null;
  counterOfferReason?: string | null;
  counterOfferStatus?: string | null;
  counterOfferExpiresAt?: string | null;
  payoutStatus?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#00A87E",
  pending_verification: "#FF9500",
  received: "#FF9500",
  shipped: "#FF9500",
  overdue: "#FF6B00",
  redeemed: "#6B7280",
  forfeited: "#4B5563",
  on_hold: "#FF9500",
  counter_offered: "#FF6B00",
  returned: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending_verification: "Pending Inspection",
  received: "Received at Hub",
  shipped: "In Transit",
  overdue: "Overdue",
  redeemed: "Redeemed",
  forfeited: "Forfeited",
  on_hold: "10-Day Hold",
  counter_offered: "Counter-Offer Sent",
  returned: "Returned",
};

// ── Mock data fallback (used when API not authenticated) ──
function getMockAdminLoans(): AdminLoan[] {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  const daysAhead = (n: number) => new Date(now.getTime() + n * 86400000).toISOString();
  const mockNote = (text: string): LoanNote => ({ text, createdAt: daysAgo(1) });

  return [
    { id: "1", loanId: "PP-LOAN-001", itemDescription: "9ct Gold Chain 20g — Prouds", principal: 500, interestRate: "26.25%", isGold: true, status: "active", trackingNumber: "33PP001", totalInterestPaid: "131.25", interestPaidThrough: daysAgo(10), dueDate: daysAhead(60), redeemedAt: null, createdAt: daysAgo(25), notes: [mockNote("Customer paid 1 month interest on time"), mockNote("Gold verified at hub — 9ct confirmed")] },
    { id: "2", loanId: "PP-LOAN-002", itemDescription: "iPhone 15 Pro 256GB", principal: 400, interestRate: "35.00%", isGold: false, status: "active", trackingNumber: "33PP002", totalInterestPaid: "0", interestPaidThrough: null, dueDate: daysAhead(5), redeemedAt: null, createdAt: daysAgo(25), notes: [mockNote("Interest due — SMS reminder sent")] },
    { id: "3", loanId: "PP-LOAN-003", itemDescription: "Galaxy Watch 6 Classic", principal: 150, interestRate: "35.00%", isGold: false, status: "active", trackingNumber: "33PP003", totalInterestPaid: "52.50", interestPaidThrough: daysAgo(5), dueDate: daysAhead(35), redeemedAt: null, createdAt: daysAgo(25), notes: [] },
    { id: "4", loanId: "PP-LOAN-004", itemDescription: "Surface Laptop 5", principal: 250, interestRate: "35.00%", isGold: false, status: "active", trackingNumber: "33PP004", totalInterestPaid: "0", interestPaidThrough: null, dueDate: daysAhead(5), redeemedAt: null, createdAt: daysAgo(25), notes: [mockNote("Interest overdue — 2nd SMS sent"), mockNote("Called customer — no answer")] },
    { id: "5", loanId: "PP-LOAN-005", itemDescription: "PS5 Slim + 2 controllers", principal: 200, interestRate: "35.00%", isGold: false, status: "pending_verification", trackingNumber: "33PP005", totalInterestPaid: "0", interestPaidThrough: null, dueDate: daysAhead(90), redeemedAt: null, createdAt: daysAgo(3), notes: [mockNote("Received at hub — needs inspection"), mockNote("Box slightly damaged, item OK")] },
    { id: "6", loanId: "PP-BUY-001", itemDescription: "Nintendo Switch OLED + 4 games", principal: 120, interestRate: "N/A", isGold: false, status: "on_hold", trackingNumber: "33PP006", totalInterestPaid: "0", interestPaidThrough: null, dueDate: daysAhead(7), redeemedAt: null, createdAt: daysAgo(3), notes: [mockNote("Buy outright — 10 day hold expires " + new Date(now.getTime() + 7 * 86400000).toLocaleDateString("en-AU"))] },
    { id: "7", loanId: "PP-LOAN-006", itemDescription: "Canon EOS R6 Body", principal: 800, interestRate: "25.00%", isGold: false, status: "overdue", trackingNumber: "33PP007", totalInterestPaid: "600.00", interestPaidThrough: daysAgo(25), dueDate: daysAgo(15), redeemedAt: null, createdAt: daysAgo(55), notes: [mockNote("OVERDUE — begin forfeiture process"), mockNote("Final SMS + email sent"), mockNote("Escalate to Adam for approval")] },
    { id: "8", loanId: "PP-LOAN-007", itemDescription: "iPad Pro 12.9", principal: 350, interestRate: "35.00%", isGold: false, status: "redeemed", trackingNumber: "33PP008", totalInterestPaid: "105.00", interestPaidThrough: daysAgo(20), dueDate: daysAgo(70), redeemedAt: daysAgo(20), createdAt: daysAgo(110), notes: [mockNote("Redeemed in full — item shipped back via locker")] },
    { id: "9", loanId: "PP-LOAN-008", itemDescription: "Dyson V15 Detect", principal: 200, interestRate: "35.00%", isGold: false, status: "forfeited", trackingNumber: "33PP009", totalInterestPaid: "70.00", interestPaidThrough: daysAgo(45), dueDate: daysAgo(30), redeemedAt: null, createdAt: daysAgo(120), notes: [mockNote("Forfeited — sold on Gumtree for $180"), mockNote("Residual equity: $180 - $200 - $70 - $91.80 = NEGATIVE — no payout due")] },
    { id: "10", loanId: "PP-LOAN-009", itemDescription: "Rolex Submariner (replica)", principal: 100, interestRate: "35.00%", isGold: false, status: "counter_offered", trackingNumber: "33PP010", totalInterestPaid: "0", interestPaidThrough: null, dueDate: daysAhead(90), redeemedAt: null, createdAt: daysAgo(5), notes: [mockNote("Inspected — NOT authentic Rolex"), mockNote("Original quote $800 revoked — counter-offer $100 sent"), mockNote("Customer has 48 hours to respond")] },
  ];
}

type Tab = "all" | "active" | "overdue" | "pending" | "holds" | "completed" | "counter";

export default function AdminPage() {
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMockMode, setIsMockMode] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<AdminLoan | null>(null);
  const [noteText, setNoteText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accessDenied, setAccessDenied] = useState(false);

  // ── Fetch loans from API on mount ──
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAccessDenied(false);
    try {
      const res = await fetch("/api/admin/inspect");
      if (res.status === 403) {
        // Logged in as customer — DENY ACCESS
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      if (res.status === 401) {
        // Not logged in — mock mode for demo
        setIsMockMode(true);
        setLoans(getMockAdminLoans());
      } else if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      } else {
        const data = await res.json();
        setIsMockMode(false);
        setLoans(data.loans || []);
      }
    } catch (err) {
      setIsMockMode(true);
      setLoans(getMockAdminLoans());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // ── Call the real API for admin actions ──
  async function callAdminAction(action: string, loanId: string, extra?: Record<string, any>) {
    setActionLoading(true);
    setError(null);
    try {
      if (isMockMode) {
        // Mock mode — simulate the action locally
        setLoans(prev => prev.map(l => {
          if (l.loanId !== loanId) return l;
          const newNote: LoanNote = { text: "", createdAt: new Date().toISOString() };
          switch (action) {
            case "mark_received": newNote.text = "Marked as received at hub"; return { ...l, status: "received", notes: [...l.notes, newNote] };
            case "confirm_quote": newNote.text = "Loan approved — inspection passed"; return { ...l, status: "active", notes: [...l.notes, newNote] };
            case "counter_offer": newNote.text = `Counter-offer sent: $${extra?.counterAmount || 0} — ${extra?.counterReason || ""}`; return { ...l, status: "counter_offered", notes: [...l.notes, newNote] };
            case "extend_loan": { const newDue = new Date(l.dueDate).getTime() + 30 * 86400000; newNote.text = `Loan extended 30 days — new due date: ${new Date(newDue).toLocaleDateString("en-AU")}`; return { ...l, dueDate: new Date(newDue).toISOString(), status: "active", notes: [...l.notes, newNote] }; }
            case "redeem": newNote.text = "Redeemed — payment received"; return { ...l, status: "redeemed", redeemedAt: new Date().toISOString(), notes: [...l.notes, newNote] };
            case "forfeit": newNote.text = "Forfeited — item now PawnPass property"; return { ...l, status: "forfeited", notes: [...l.notes, newNote] };
            case "release_hold": newNote.text = "10-day hold released — item available for resale"; return { ...l, status: "forfeited", notes: [...l.notes, newNote] };
            case "add_note": newNote.text = extra?.noteText || ""; return { ...l, notes: [...l.notes, newNote] };
            case "send_sms": newNote.text = `SMS sent: "${extra?.message || ""}"`; return { ...l, notes: [...l.notes, newNote] };
            case "send_email": newNote.text = `Email sent: "${extra?.message || ""}"`; return { ...l, notes: [...l.notes, newNote] };
            default: return l;
          }
        }));
      } else {
        // Real API call
        const res = await fetch("/api/admin/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, loanId, ...extra }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `API returned ${res.status}` }));
          throw new Error(errData.error || `API returned ${res.status}`);
        }

        // Refetch loans to get updated state
        await fetchLoans();
      }
    } catch (err: any) {
      setError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  // ── Add a note (separate from action buttons) ──
  async function addNote() {
    if (!selectedLoan || !noteText.trim()) return;
    await callAdminAction("add_note", selectedLoan.loanId, { noteText: noteText.trim() });
    setNoteText("");
    // Update selected loan locally if in mock mode
    if (isMockMode) {
      const updated = loans.find(l => l.loanId === selectedLoan.loanId);
      if (updated) setSelectedLoan(updated);
    }
  }

  // ── Admin action wrappers ──
  function handleMarkReceived(loanId: string) { callAdminAction("mark_received", loanId); }
  function handleApproveLoan(loanId: string) { callAdminAction("confirm_quote", loanId); }
  function handleSendCounter(loanId: string) {
    const amt = prompt("Counter-offer amount ($)?");
    if (!amt) return;
    const reason = prompt("Reason for counter-offer?") || "Item condition differs from quote";
    callAdminAction("counter_offer", loanId, { counterAmount: parseFloat(amt), counterReason: reason });
  }
  function handleExtend(loanId: string) { callAdminAction("extend_loan", loanId); }
  function handleRedeem(loanId: string) { callAdminAction("redeem", loanId); }
  function handleForfeit(loanId: string) { callAdminAction("forfeit", loanId); }
  function handleReleaseHold(loanId: string) { callAdminAction("release_hold", loanId); }
  function handleSendSMS(loanId: string) {
    const msg = prompt("SMS message to customer:");
    if (msg) callAdminAction("send_sms", loanId, { message: msg });
  }
  function handleSendEmail(loanId: string) {
    const msg = prompt("Email message to customer:");
    if (msg) callAdminAction("send_email", loanId, { message: msg });
  }

  // ── Filter loans by tab + search ──
  const filtered = loans.filter((l) => {
    const matchesSearch = !search || l.loanId.toLowerCase().includes(search.toLowerCase()) || l.itemDescription.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    switch (tab) {
      case "active": return l.status === "active";
      case "overdue": return l.status === "overdue";
      case "pending": return l.status === "pending_verification" || l.status === "received" || l.status === "shipped";
      case "holds": return l.status === "on_hold";
      case "completed": return l.status === "redeemed" || l.status === "forfeited" || l.status === "returned";
      case "counter": return l.status === "counter_offered";
      default: return true;
    }
  });

  // ── Stats ──
  const stats = {
    total: loans.length,
    active: loans.filter(l => l.status === "active").length,
    overdue: loans.filter(l => l.status === "overdue").length,
    pending: loans.filter(l => l.status === "pending_verification" || l.status === "received" || l.status === "shipped").length,
    holds: loans.filter(l => l.status === "on_hold").length,
    interestDue: loans.filter(l => l.status === "active" && (!l.interestPaidThrough || new Date(l.interestPaidThrough) < new Date(Date.now() - 25 * 86400000))).length,
    totalValue: loans.filter(l => l.status === "active" || l.status === "overdue").reduce((sum, l) => sum + l.principal, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <p className="text-gray-400 text-sm">Loading admin dashboard...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.3)" }}>
          <div className="text-5xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-white mb-2">403 — Access Denied</h1>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            This area is restricted to PawnPass Hub staff and administrators. Customer accounts do not have permission to view internal administration tools.
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

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All", count: stats.total },
    { id: "active", label: "Active", count: stats.active },
    { id: "overdue", label: "Overdue", count: stats.overdue },
    { id: "pending", label: "Pending", count: stats.pending },
    { id: "holds", label: "On Hold", count: stats.holds },
    { id: "counter", label: "Counter-Offered", count: loans.filter(l => l.status === "counter_offered").length },
    { id: "completed", label: "Completed", count: loans.filter(l => l.status === "redeemed" || l.status === "forfeited").length },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LogoHeader backLink="/" backLabel="← Home" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          {isMockMode && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,149,0,0.15)", color: "#FF9500" }}>
              ⚠ MOCK MODE — login as admin for live data
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mb-8">Manage loans, buys, inspections, and compliance</p>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg p-3" style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)" }}>
            <p className="text-sm text-[#FF6B00]">⚠ {error}</p>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-8">
          {[
            { label: "Active", value: stats.active, color: "#00A87E" },
            { label: "Overdue", value: stats.overdue, color: "#FF6B00" },
            { label: "Pending", value: stats.pending, color: "#FF9500" },
            { label: "On Hold", value: stats.holds, color: "#FF9500" },
            { label: "Interest Due", value: stats.interestDue, color: "#FF6B00" },
            { label: "Total Loans", value: stats.total, color: "#FFFFFF" },
            { label: "Outstanding $", value: `$${stats.totalValue.toLocaleString()}`, color: "#FF6B00" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + SAPOL */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by loan ID or item..."
            className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-100 bg-white/[0.03] placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
          />
          <a href="/api/admin/sapol-report?format=csv" className="rounded-lg px-5 py-2.5 text-sm font-medium text-white border border-white/10 hover:border-white/20 transition-colors" style={{ background: "rgba(255,255,255,0.03)" }}>
            📋 SAPOL Report
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id ? "text-white" : "text-gray-400 hover:text-white"
              }`}
              style={tab === t.id ? { background: "#FF6B00" } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Loan list */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No loans in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((loan) => {
              const isOverdue = loan.status === "overdue" || (loan.status === "active" && new Date(loan.dueDate) < new Date());
              const interestDue = loan.status === "active" && (!loan.interestPaidThrough || new Date(loan.interestPaidThrough) < new Date(Date.now() - 25 * 86400000));
              return (
                <div
                  key={loan.id}
                  className="rounded-xl p-5 cursor-pointer transition-all hover:border-white/20"
                  style={{ background: "rgba(255,255,255,0.03)", border: isOverdue ? "1px solid rgba(255,107,0,0.3)" : "1px solid rgba(255,255,255,0.08)" }}
                  onClick={() => setSelectedLoan(loan)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-mono text-gray-500">{loan.loanId}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: STATUS_COLORS[loan.status] || "#6B7280" }}>
                          {STATUS_LABELS[loan.status] || loan.status}
                        </span>
                        {loan.isGold && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,168,126,0.15)", color: "#00A87E" }}>GOLD</span>}
                        {isOverdue && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00" }}>⚠ OVERDUE</span>}
                        {interestDue && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,149,0,0.15)", color: "#FF9500" }}>INTEREST DUE</span>}
                      </div>
                      <h3 className="text-sm font-medium text-white mb-1">{loan.itemDescription}</h3>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Principal: ${loan.principal}</span>
                        <span>Rate: {loan.interestRate}/mo</span>
                        {loan.dueDate && <span>Due: {new Date(loan.dueDate).toLocaleDateString("en-AU")}</span>}
                        {loan.trackingNumber && <span>Tracking: {loan.trackingNumber}</span>}
                        {loan.totalInterestPaid && loan.totalInterestPaid !== "0" && <span>Interest paid: ${loan.totalInterestPaid}</span>}
                        {loan.notes && loan.notes.length > 0 && <span>📝 {loan.notes.length} notes</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">${loan.principal}</p>
                      <p className="text-xs text-gray-500">Created {new Date(loan.createdAt).toLocaleDateString("en-AU")}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail drawer */}
        {selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setSelectedLoan(null)}>
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedLoan.loanId}</h2>
                  <p className="text-sm text-gray-400">{selectedLoan.itemDescription}</p>
                </div>
                <button onClick={() => setSelectedLoan(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><span className="text-gray-500">Status:</span> <span className="text-white">{STATUS_LABELS[selectedLoan.status]}</span></div>
                <div><span className="text-gray-500">Principal:</span> <span className="text-white">${selectedLoan.principal}</span></div>
                <div><span className="text-gray-500">Rate:</span> <span className="text-white">{selectedLoan.interestRate}/mo</span></div>
                <div><span className="text-gray-500">Gold:</span> <span className="text-white">{selectedLoan.isGold ? "Yes" : "No"}</span></div>
                <div><span className="text-gray-500">Due date:</span> <span className="text-white">{new Date(selectedLoan.dueDate).toLocaleDateString("en-AU")}</span></div>
                <div><span className="text-gray-500">Tracking:</span> <span className="text-white font-mono text-xs">{selectedLoan.trackingNumber || "N/A"}</span></div>
                <div><span className="text-gray-500">Interest paid:</span> <span className="text-white">${selectedLoan.totalInterestPaid || "0"}</span></div>
                <div><span className="text-gray-500">Created:</span> <span className="text-white">{new Date(selectedLoan.createdAt).toLocaleDateString("en-AU")}</span></div>
                {selectedLoan.payoutStatus && <div><span className="text-gray-500">Payout:</span> <span className="text-white">{selectedLoan.payoutStatus}</span></div>}
                {selectedLoan.counterOfferAmount != null && <div><span className="text-gray-500">Counter-offer:</span> <span className="text-white">${selectedLoan.counterOfferAmount}</span></div>}
              </div>

              {/* Admin actions */}
              <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-sm font-semibold text-white mb-3">Admin Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {/* Pending verification / received — inspection actions */}
                  {(selectedLoan.status === "pending_verification" || selectedLoan.status === "received") && (
                    <>
                      <button onClick={() => handleMarkReceived(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "#FF9500" }}>Mark Received</button>
                      <button onClick={() => handleApproveLoan(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "#00A87E" }}>✓ Approve Loan</button>
                      <button onClick={() => handleSendCounter(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "#FF6B00" }}>Send Counter-Offer</button>
                    </>
                  )}
                  {/* Active — lifecycle actions */}
                  {selectedLoan.status === "active" && (
                    <>
                      <button onClick={() => handleExtend(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "rgba(255,255,255,0.1)" }}>⏳ Extend 30 Days</button>
                      <button onClick={() => handleRedeem(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "#00A87E" }}>✓ Mark Redeemed</button>
                      <button onClick={() => handleForfeit(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "#FF6B00" }}>⚠ Forfeit Item</button>
                    </>
                  )}
                  {/* Overdue */}
                  {selectedLoan.status === "overdue" && (
                    <>
                      <button onClick={() => handleForfeit(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "#FF6B00" }}>⚠ Forfeit Item</button>
                      <button onClick={() => handleExtend(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "rgba(255,255,255,0.1)" }}>⏳ Extend 30 Days</button>
                    </>
                  )}
                  {/* On hold */}
                  {selectedLoan.status === "on_hold" && (
                    <>
                      <button onClick={() => handleReleaseHold(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "#00A87E" }}>✓ Release Hold (Ready for Resale)</button>
                    </>
                  )}
                  {/* Counter-offered */}
                  {selectedLoan.status === "counter_offered" && (
                    <>
                      <p className="text-xs text-gray-400 w-full mb-2">Waiting for customer response (48h expiry)</p>
                      <button onClick={() => handleExtend(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "rgba(255,255,255,0.1)" }}>⏳ Extend Counter-Offer</button>
                    </>
                  )}
                  {/* Always available */}
                  <button onClick={() => handleSendSMS(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "rgba(255,255,255,0.1)" }}>📱 Send SMS</button>
                  <button onClick={() => handleSendEmail(selectedLoan.loanId)} disabled={actionLoading} className="rounded-lg px-4 py-2 text-xs font-medium text-white" style={{ background: "rgba(255,255,255,0.1)" }}>📧 Send Email</button>
                </div>
              </div>

              {/* Notes section */}
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-sm font-semibold text-white mb-3">Notes & History ({selectedLoan.notes?.length || 0})</h3>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {(selectedLoan.notes || []).map((note, i) => (
                    <div key={i} className="text-xs text-gray-400 p-2 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                      {note.createdAt && <span className="text-gray-600 mr-2">{new Date(note.createdAt).toLocaleDateString("en-AU")}</span>}
                      {note.text}
                    </div>
                  ))}
                  {(!selectedLoan.notes || selectedLoan.notes.length === 0) && (
                    <p className="text-xs text-gray-600">No notes yet.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-100 bg-white/[0.03] placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                    onKeyDown={(e) => e.key === "Enter" && addNote()}
                  />
                  <button onClick={addNote} disabled={actionLoading} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "#FF6B00" }}>Add</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
