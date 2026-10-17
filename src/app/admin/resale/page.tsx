"use client";

import { useState, useEffect, useCallback } from "react";
import LogoHeader from "@/components/LogoHeader";

interface Listing {
  id: string;
  platform: string;
  externalListingId: string;
  listingUrl: string;
  status: string;
  listPrice: number;
}

interface InventoryItem {
  id: string;
  sku: string;
  title: string;
  description: string;
  category: string;
  conditionGrade: string;
  costBasis: number;
  targetPrice: number;
  minPrice: number;
  status: string;
  soldPrice?: number | null;
  soldPlatform?: string | null;
  soldAt?: string | null;
  costOfSale?: string | null;
  residualEquityAmount?: string | null;
  listings: Listing[];
}

export default function AdminResalePage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Sale Modal state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [soldPlatform, setSoldPlatform] = useState("ebay");
  const [soldPrice, setSoldPrice] = useState("");

  const [accessDenied, setAccessDenied] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const res = await fetch("/api/admin/resale");
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleListAll = async (itemId: string) => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/resale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "list_item",
          inventoryId: itemId,
          platforms: ["ebay", "facebook", "gumtree", "vinted"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Listing failed");
      setFeedback({ type: "success", msg: data.message });
      await fetchInventory();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Action failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordSale = async () => {
    if (!selectedItem || !soldPrice) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/resale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_sale",
          inventoryId: selectedItem.id,
          soldPlatform,
          soldPrice: parseFloat(soldPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sale recording failed");
      setFeedback({ type: "success", msg: data.message });
      setSelectedItem(null);
      setSoldPrice("");
      await fetchInventory();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Action failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const PLATFORM_COLORS: Record<string, string> = {
    ebay: "#E53238",
    facebook: "#1877F2",
    gumtree: "#00B075",
    vinted: "#09B1BA",
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.3)" }}>
          <div className="text-5xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-white mb-2">403 — Access Denied</h1>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            The Internal Resale Hub is strictly restricted to staff and administrators. Customer accounts do not have permission to view inventory distribution tools.
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
              <h1 className="text-3xl font-bold text-white">Internal Resale Auto-Lister Hub</h1>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10">
                STRICTLY INTERNAL
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Multi-platform distribution (eBay, FB Marketplace, Gumtree, Vinted) with cross-platform auto-delisting
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

        {/* Content Policy Notice */}
        <div className="mb-8 rounded-xl p-4 border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <div className="text-2xl">🔒</div>
          <div className="text-xs text-amber-200">
            <p className="font-bold mb-0.5">INTERNAL POLICY REMINDER:</p>
            <p>
              Under no circumstances are retail sales channels or platform names (eBay, FB Marketplace, Gumtree, Vinted) to be referenced on public customer-facing web pages. Customers only see pawn loans or buy-outright options.
            </p>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-semibold text-white mb-4">Forfeited Stock Inventory ({inventory.length})</h2>

          {loading ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading inventory...</p>
          ) : inventory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No forfeited items in inventory</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl p-4 sm:p-5 border border-white/10 bg-white/[0.01] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="w-full md:flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[#FF6B00]">{item.sku}</span>
                      <span
                        className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: item.status === "sold" ? "rgba(0,168,126,0.2)" : "rgba(255,255,255,0.1)",
                          color: item.status === "sold" ? "#00A87E" : "#9CA3AF",
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-400 mb-3">{item.description}</p>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      <span>Cost Basis: <strong className="text-white">${item.costBasis}</strong></span>
                      <span>Target Resale: <strong className="text-white">${item.targetPrice}</strong></span>
                      <span>Min Acceptable: <strong className="text-white">${item.minPrice}</strong></span>
                      {item.soldPrice && <span>Sold Price: <strong className="text-[#00A87E]">${item.soldPrice}</strong></span>}
                      {item.residualEquityAmount && (
                        <span>Borrower Surplus: <strong className="text-[#FF6B00]">${item.residualEquityAmount}</strong></span>
                      )}
                    </div>

                    {/* Active Multi-Platform Listings Badges */}
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] text-gray-500 font-mono">LISTINGS:</span>
                      {["ebay", "facebook", "gumtree", "vinted"].map((plat) => {
                        const listing = item.listings?.find((l) => l.platform === plat);
                        return (
                          <span
                            key={plat}
                            className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{
                              background: listing ? `${PLATFORM_COLORS[plat]}20` : "rgba(255,255,255,0.05)",
                              color: listing ? PLATFORM_COLORS[plat] : "#4B5563",
                              border: listing ? `1px solid ${PLATFORM_COLORS[plat]}40` : "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            {plat}: {listing ? listing.status : "not listed"}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    {item.status !== "sold" && (
                      <>
                        <button
                          onClick={() => handleListAll(item.id)}
                          disabled={submitting}
                          className="w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02]"
                          style={{ background: "#FF6B00" }}
                        >
                          🚀 Auto-List Everywhere
                        </button>
                        <button
                          onClick={() => setSelectedItem(item)}
                          disabled={submitting}
                          className="w-full py-2.5 rounded-xl text-xs font-semibold text-white border border-emerald-500/30 bg-emerald-500/20 hover:scale-[1.02] transition-all"
                        >
                          💰 Record Sale & Auto-Delist
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Record Sale Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div
              className="max-w-md w-full rounded-2xl p-6 space-y-4"
              style={{ background: "#0A0A0A", border: "1px solid rgba(0,168,126,0.4)" }}
            >
              <h3 className="text-xl font-bold text-white">Record Sale & Trigger Auto-Delist</h3>
              <p className="text-xs text-gray-400">
                Item: <span className="text-white font-bold">{selectedItem.title}</span> ({selectedItem.sku})
              </p>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Selling Platform</label>
                <select
                  value={soldPlatform}
                  onChange={(e) => setSoldPlatform(e.target.value)}
                  className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white bg-black outline-none"
                >
                  <option value="ebay">eBay Australia</option>
                  <option value="facebook">Facebook Marketplace</option>
                  <option value="gumtree">Gumtree</option>
                  <option value="vinted">Vinted</option>
                  <option value="private">Private Sale / In-Person</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Final Sale Price ($)</label>
                <input
                  type="number"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  placeholder={`e.g. ${selectedItem.targetPrice}`}
                  className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-lg font-bold text-white bg-black focus:border-[#00A87E] outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1 text-gray-400">
                <p className="font-bold text-white">Cross-Platform Auto-Delist Preview:</p>
                <p>When recorded, status will set to SOLD and all active listings on other platforms will immediately receive auto-delist signals to prevent double-selling.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRecordSale}
                  disabled={submitting || !soldPrice}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#00A87E] hover:scale-[1.02] transition-transform"
                >
                  Confirm Sale & Delist Others
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
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