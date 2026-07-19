"use client";

import { useState, useEffect, useCallback } from "react";

interface Signup {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
  notifiedAt: string | null;
}

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [stats, setStats] = useState({ total: 0, notified: 0, notNotified: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSignups = useCallback(async (apiKey: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/signups", {
        headers: { "x-admin-key": apiKey },
      });
      if (res.status === 401) {
        setError("Invalid key");
        setAuthed(false);
        return;
      }
      const data = await res.json();
      setSignups(data.signups || []);
      setStats({ total: data.total, notified: data.notified, notNotified: data.notNotified });
      setAuthed(true);
      setError("");
      sessionStorage.setItem("pp_admin_key", apiKey);
    } catch {
      setError("Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedKey = sessionStorage.getItem("pp_admin_key");
    if (savedKey) {
      setKey(savedKey);
      fetchSignups(savedKey);
    }
  }, [fetchSignups]);

  async function markNotified(email: string) {
    const apiKey = sessionStorage.getItem("pp_admin_key") || key;
    await fetch("/api/admin/signups", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": apiKey },
      body: JSON.stringify({ action: "mark_notified", email }),
    });
    fetchSignups(apiKey);
  }

  function login(e: React.FormEvent) {
    e.preventDefault();
    fetchSignups(key);
  }

  function exportCsv() {
    const header = "Email,Name,Phone,Created,Notified\n";
    const rows = signups.map((s) => {
      return `${s.email},${s.name || ""},${s.phone || ""},${new Date(s.createdAt).toISOString()},${s.notifiedAt ? "Yes" : "No"}`;
    });
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pawnpass-signups.csv";
    a.click();
  }

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0A0A0A" }}>
        <div className="max-w-md w-full rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: "#FF6B00" }}>P</div>
            <span className="text-lg font-bold text-white">PawnPass Admin</span>
          </div>
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Admin Key</label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter admin key"
                required
                className="w-full rounded-lg border px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !key}
              className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#FF6B00" }}
            >
              {loading ? "Loading…" : "Access dashboard →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      {/* Nav */}
      <nav className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: "#FF6B00" }}>P</div>
            <span className="text-lg font-bold text-white">PawnPass Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={exportCsv} className="text-sm text-gray-400 hover:text-white transition-colors">Export CSV</button>
            <button onClick={() => { setAuthed(false); sessionStorage.removeItem("pp_admin_key"); }} className="text-sm text-gray-400 hover:text-white transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-gray-500 mb-2">Total signups</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-gray-500 mb-2">Notified</p>
            <p className="text-3xl font-bold" style={{ color: "#00A87E" }}>{stats.notified}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-gray-500 mb-2">Pending</p>
            <p className="text-3xl font-bold" style={{ color: "#FF6B00" }}>{stats.notNotified}</p>
          </div>
        </div>

        {/* Table */}
        <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Launch List</h2>
        {signups.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-gray-500">No signups yet.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">Email</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">Phone</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">Joined</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3 text-sm text-white">{s.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{s.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3">
                      {s.notifiedAt ? (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(0,168,126,0.1)", color: "#00A87E" }}>Notified</span>
                      ) : (
                        <button onClick={() => markNotified(s.email)} className="text-xs px-2 py-1 rounded-full transition-colors hover:opacity-80" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00" }}>
                          Mark notified
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
